import * as fs from "fs";
import * as path from "path";
import {parse} from "csv-parse";

const latencies = require('./datas/latencies.json');

type Transaction = {
    id: string;
    amount: string;
    bank_country_code: string;
};

/**
 * This is the functiont to reach out the transactions that have large amount of USD in time.
 * @param {Number} timeLimit volunteer's time
 * @param {Array} transactions 
 * @param {Object} latencies
 */
 const runAlgorithm = async (timeLimit: number, transactions: Array<Transaction>, latencies:any) => {    

    let maxUsdForMili = []; // list of maximum usd amount during certain miliseconds.
    let txsForMaxMili = []; // List of transactions for maximum usd amount during certain miliseconds.

    // fomart the variables.
    for (let k = 0; k<= timeLimit; k++){
        maxUsdForMili[k] = 0;
        txsForMaxMili[k] = [];        
    }

    for (let i = 1; i<=timeLimit; i++){
        for(let j = 0; j< transactions.length; j++){
            const  t = latencies[transactions[j].bank_country_code];
           
            if(t <= i && !txsForMaxMili[i-t].includes(j)){
                const usdAmount = Number(maxUsdForMili[i-t]) + Number(transactions[j].amount)
                if(maxUsdForMili[i]<usdAmount){
                    maxUsdForMili[i] = usdAmount;
                    txsForMaxMili[i] = txsForMaxMili[i-t].concat(j)
                }
            }
        }
    }

    return {transaction_indexes: txsForMaxMili[timeLimit], result_max_amt: maxUsdForMili[timeLimit]};
}

// function should return a subset (or full array)
// that will maximize the USD value and fit the transactions under 1 second
async function prioritize(transaction: Array<Transaction>, totalTime=1000) {

    const {transaction_indexes, result_max_amt} = await runAlgorithm(totalTime, transaction, latencies);

    const transactions = transaction_indexes.map((v)=>{
        return transaction[v];
    });  

    console.log('MAX_AMOUNT', result_max_amt);
    console.log('TRANSACTION_LIST', transactions);
}

const main = async() => {   

    //importing csv file
    const csvFilePath = path.resolve(__dirname, 'datas/transactions.csv');
    const headers = ['id', 'amount', 'bank_country_code'];
    const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });

    parse(fileContent, {
        delimiter: ',',
        columns: headers,
    }, async (error, transactions: Transaction[]) => {
        if (error) {
        console.error(error);
        }
        // timelimit - 50ms
        console.log("Testing Time Limit: 50 ms");
        await prioritize(transactions.slice(1), 50);
        // timelimit - 60ms
        console.log("Testing Time Limit: 60 ms");
        await prioritize(transactions.slice(1), 60);
        // // timelimit - 90ms
        console.log("Testing Time Limit: 90 ms");
        await prioritize(transactions.slice(1), 90);
        // // timelimit - 1000ms
        console.log("Testing Time Limit: 1000 ms");
        await prioritize(transactions.slice(1), 1000);

    });
}

main();
