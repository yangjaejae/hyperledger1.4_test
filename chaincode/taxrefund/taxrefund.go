/*
* Licensed to the Apache Software Foundation (ASF) under one
* or more contributor license agreements.  See the NOTICE file
* distributed with this work for additional information
* regarding copyright ownership.  The ASF licenses this file
* to you under the Apache License, Version 2.0 (the
* "License"); you may not use this file except in compliance
* with the License.  You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing,
* software distributed under the License is distributed on an
* "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
* KIND, either express or implied.  See the License for the
* specific language governing permissions and limitations
* under the License.
*/


package main


import (
	"encoding/json"
	"fmt"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	sc "github.com/hyperledger/fabric/protos/peer"
	"time"
	"bytes"
)

// Define the Smart Contract structure
type SmartContract struct {
}

// Define the tax refund structure.  Structure tags are used by encoding/json library
type TxBody struct {
	ReferenceId  		 string 	 `json:"reference_tx_id"`
	CurrentTxId     	 string 	 `json:"current_tx_id"`
	RequestType  		 string 	 `json:"previous_tx_id"`
	TxStatus	  		 int         `json:"transaction_status"`
	RefundType   		 string 	 `json:"tax_refund_type"`
	TaxRefundStatus	  	 int         `json:"tax_refund_status"`
	CustomerId           string      `json:"customer_id"`
	TaxRefunderId        string      `json:"tax_refund_company_id"`
	StoreId              string      `json:"merchant_id"`
	PurchaseSerialNum    string      `json:"merchant_serial_num"`
	TaxRefundSerialNum   string      `json:"tax_refund_serial_num"`
	SalesDateTime		 string      `json:"sales_created"`
	TxDateTime		 	 string      `json:"tx_created"`
	TotalAmount          string      `json:"total_sales_amount"`
	TotalQuantity        string         `json:"total_sales_qty"`
	TotRefund            string         `json:"total_tax_refund_amount"`
	TotalVAT             string      `json:"total_value_added_tax"`
	TotalIcTax           string      `json:"total_individual_consumption_tax"`
	TotalEduTax          string      `json:"total_education_tax"`
	TotalSpecialTax      string      `json:"total_special_tax_for_rural_development"`
	Details              []TxDetails `json:"sales_details"`
}

type TxDetails struct {
	ProductNumber  		 string 	`json:"product_name"`
	ProductSerialNum	 string 	`json:"product_serial_num"`
	ProductCode    		 string 	`json:"product_management_code"`
	IndividualQty  		 string 	    `json:"individual_qty"`
	IndividualAmt  		 string 	`json:"individual_sales_amount"`
	SalePrice      		 string 	`json:"sales_price"`
	IndividualVat  		 string 	`json:"value_added_tax"`
	IndividualIct  		 string 	`json:"individual_consumption_tax"`
	IndividualEdut 		 string 	`json:"education_tax"`
	IndividualStr  		 string 	`json:"special_tax_for_rural_development"`
}

type ReturnMsg struct {
	Status   string `json:"status"`
	Result   string `json:"result"`
	DateTime string `json:"date"`
}

/*
* The Init method is called when the Smart Contract "tax refund" is instantiated by the blockchain network
* Best practice is to have any Ledger initialization in separate function -- see initLedger()
*/
func (s *SmartContract) Init(APIstub shim.ChaincodeStubInterface) sc.Response {
	return shim.Success(nil)
}

/*
* The Invoke method is called as a result of an application request to run the Smart Contract "tax refund"
* The calling application program has also specified the particular smart contract function to be called, with arguments
*/
func (s *SmartContract) Invoke(APIstub shim.ChaincodeStubInterface) sc.Response {

	// Retrieve the requested Smart Contract function and arguments
	function, args := APIstub.GetFunctionAndParameters()
	// Route to the appropriate handler function to interact with the ledger appropriately

	if function == "getSingleTx" {
		return s.getTransactionReceiptByTxId(APIstub, args)
	} else if function == "getReferTx" {
		return s.getReferenceTransactionReceiptsByTxId(APIstub, args)
	} else if function == "getTxByCondition" {
		return s.getTransactionReceiptsByConditions(APIstub, args)
	} else if function == "initLedger" {
		return s.Init(APIstub)
	} else if function == "getTxByUserId" {
		return s.getTransactionByUserId(APIstub, args)
	} else if function == "getAllTx" {
		return s.getAllTransactions(APIstub, args)
	} else if function == "invokeRefundComplete" {
		return s.invokeRefundTxComplete(APIstub, args)
	}

	return shim.Error("Invalid Smart Contract function name.")
}


func (s *SmartContract) invokeRefundTxComplete(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	var request TxBody
	var key string     // Entities
	requestData := []byte(args[1])
	fmt.Println("Request Data: ", args[1])
	err := json.Unmarshal(requestData, &request)
	key = request.CurrentTxId;
	result, err := json.Marshal(request)
	loc, _ := time.LoadLocation("Asia/Seoul")
	now := time.Now().In(loc)
	if err != nil {
		response := &ReturnMsg{Status: "500", Result: "Incorrect value of request arguments", DateTime: fmt.Sprintf("%s", now)}
		return shim.Error(fmt.Sprintf("%s", response))
	} else if args[0] != "Client.tax_refund_company" {
		response := &ReturnMsg{Status: "400", Result: "The sender is not qualified role to propose a transaction", DateTime: fmt.Sprintf("%s", now)}
		return shim.Error(fmt.Sprintf("%s", response))
	} else {
		APIstub.PutState(key, result)
		//resultMsg, err := json.Marshal(request)
		response := &ReturnMsg{Status: "200", Result: fmt.Sprintf("%s", requestData), DateTime: fmt.Sprintf("%s", now)}
		finalResult, err := json.Marshal(response)
		if err != nil {
			return shim.Error(err.Error())
		}
		fmt.Println("Create Transaction Successfully: ", finalResult)
		return shim.Success([]byte(fmt.Sprintf("%s", finalResult)))
	}
}

func (s *SmartContract) getTransactionReceiptByTxId(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}
	queryKey := fmt.Sprintf("%s", args[0])
	loc, _ := time.LoadLocation("Asia/Seoul")
	now := time.Now().In(loc)
	resultByTxid, err := APIstub.GetState(queryKey)
	if err != nil {
		return shim.Error(err.Error())
	}
	if err != nil {
		response := &ReturnMsg{Status: "400", Result: fmt.Sprintf("Failed to get state"), DateTime: fmt.Sprintf("%s", now)}
		result, err := json.Marshal(response)
		fmt.Sprintf("Error caused by: %s", err.Error())
		return shim.Error(fmt.Sprintf("%s", result))
	}
	// buffer is a JSON array containing QueryRecords

	fmt.Printf("- getQueryResultForSpecificKey queryResult:\n%s\n", resultByTxid)
	response := &ReturnMsg{Status: "200", Result: fmt.Sprintf("%s", resultByTxid), DateTime: fmt.Sprintf("%s", now)}
	result, err := json.Marshal(response)
	return shim.Success([]byte(result))
}


func (s *SmartContract) getReferenceTransactionReceiptsByTxId(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}
	queryKey := fmt.Sprintf("{\"selector\":{\"header\":{\"reference_id\":\"%s\"}}}", args[0])

	resultsIterator, err := APIstub.GetQueryResult(queryKey)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	// buffer is a JSON array containing QueryRecords
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		// Add a comma before array members, suppress it for the first array member
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"Key\":")
		buffer.WriteString("\"")
		buffer.WriteString(queryResponse.Key)
		buffer.WriteString("\"")
		buffer.WriteString(", \"Record\":")
		// Record is a JSON object, so we write as-is
		buffer.WriteString(string(queryResponse.Value))
		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")
	fmt.Printf("- getQueryResultForSpecificKey queryResult:\n%s\n", buffer.String())
	loc, _ := time.LoadLocation("Asia/Seoul")
	now := time.Now().In(loc)
	response := &ReturnMsg{Status: "200", Result: buffer.String(), DateTime: fmt.Sprintf("%s", now)}
	result, err := json.Marshal(response)
	return shim.Success([]byte(result))

}

func (s *SmartContract) getTransactionReceiptsByConditions(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	var resultsIterator shim.StateQueryIteratorInterface
	var err error

	if args[0] == "" {
		resultsIterator2, err2 := APIstub.GetStateByRange("TR-0", "TR-99999")
		resultsIterator = resultsIterator2
		err = err2

	} else {
		queryKey := fmt.Sprintf("{\"selector\":%s}", args[0])
		resultsIterator1, err1 := APIstub.GetQueryResult(queryKey)
		resultsIterator = resultsIterator1
		err = err1
	}

	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	// buffer is a JSON array containing QueryRecords
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		// Add a comma before array members, suppress it for the first array member
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"Key\":")
		buffer.WriteString("\"")
		buffer.WriteString(queryResponse.Key)
		buffer.WriteString("\"")
		buffer.WriteString(", \"Record\":")
		// Record is a JSON object, so we write as-is
		buffer.WriteString(string(queryResponse.Value))
		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")
	fmt.Printf("- getQueryResultForSpecificKey queryResult:\n%s\n", buffer.String())
	loc, _ := time.LoadLocation("Asia/Seoul")
	now := time.Now().In(loc)
	response := &ReturnMsg{Status: "200", Result: buffer.String(), DateTime: fmt.Sprintf("%s", now)}
	result, err := json.Marshal(response)
	return shim.Success([]byte(result))
}

func (s *SmartContract) getTransactionByUserId(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	fmt.Printf("- getQueryResultForQueryString separated by Role queryString:\n%s\n", args[0])

	resultsIterator, err := APIstub.GetQueryResult(getQueryStatement(args[0], args[1]))
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	// buffer is a JSON array containing QueryRecords
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		// Add a comma before array members, suppress it for the first array member
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"Key\":")
		buffer.WriteString("\"")
		buffer.WriteString(queryResponse.Key)
		buffer.WriteString("\"")
		buffer.WriteString(", \"Record\":")
		// Record is a JSON object, so we write as-is
		buffer.WriteString(string(queryResponse.Value))
		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")
	fmt.Printf("- getQueryResultForSpecificKey queryResult:\n%s\n", buffer.String())
	loc, _ := time.LoadLocation("Asia/Seoul")
	now := time.Now().In(loc)
	response := &ReturnMsg{Status: "200", Result: buffer.String(), DateTime: fmt.Sprintf("%s", now)}
	result, err := json.Marshal(response)

	return shim.Success([]byte(result))

}


func getQueryStatement(argRole string, argId string) string {
	queryKey := ""
	if argRole == "Client.customer" {
		queryKey = fmt.Sprintf("{\"selector\":{\"body\":{\"customer_id\":\"%s\"}}}", argId)
	} else if argRole == "Client.merchant" {
		queryKey = fmt.Sprintf("{\"selector\":{\"body\":{\"store_id\":\"%s\"}}}", argId)
	} else if argRole == "Client.tax_refund_company" {
		queryKey = fmt.Sprintf("{\"selector\":{\"body\":{\"taxRefunder_id\":\"%s\"}}}", argId)
	} else {
		queryKey = ""
	}

	return queryKey
}

func (s *SmartContract) getAllTransactions(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	startKey := args[1]
	endKey := args[2]

	if args[0] != "Client.customs" {
		return shim.Error("You are not authorized with scan this data")
	}
	resultsIterator, err := APIstub.GetStateByRange(startKey, endKey)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	// buffer is a JSON array containing QueryResults
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"Key\":")
		buffer.WriteString("\"")
		buffer.WriteString(queryResponse.Key)
		buffer.WriteString("\"")
		buffer.WriteString(", \"Record\":")
		// Record is a JSON object, so we write as-is
		buffer.WriteString(string(queryResponse.Value))
		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")
	fmt.Printf("- getQueryResultForSpecificKey queryResult:\n%s\n", buffer.String())
	loc, _ := time.LoadLocation("Asia/Seoul")
	now := time.Now().In(loc)
	response := &ReturnMsg{Status: "200", Result: buffer.String(), DateTime: fmt.Sprintf("%s", now)}
	result, err := json.Marshal(response)
	return shim.Success([]byte(result))
}

// The main function is only relevant in unit test mode. Only included here for completeness.
func main() {

	// Create a new Smart Contract
	err := shim.Start(new(SmartContract))
	if err != nil {
		fmt.Printf("Error creating new Smart Contract: %s", err)
	}
}
