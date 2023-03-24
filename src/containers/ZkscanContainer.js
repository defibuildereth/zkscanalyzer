import React, { useState, useEffect } from 'react';
import AddressForm from '../components/AddressForm';
import CsvDownloader from 'react-csv-downloader';

const ZkscanContainer = () => {

    let total = 0;
    let txArray = [];

    const [address, setAddress] = useState("");
    const [info, setInfo] = useState("");
    const [decimals, setDecimals] = useState([]);
    const [allInfo, setAllInfo] = useState([]);
    const [ethPrice, setEthPrice] = useState(0);
    const [nonce, setNonce] = useState("");
    const [totalVol, setTotalVol] = useState(0);
    const [uniques, setUniques] = useState([]);
    const [txNumber, setTxNumber] = useState(0);
    const [datas, setDatas] = useState([]);

    useEffect(async () => {
        let balances = await searchAddress(address)
        let decimals = await getDecimals(balances)
        // console.log(decimals)
        let allInfo = parsePrices(balances, decimals)
        let ethPrice = getEthPrice(allInfo)
        let allTransactions = await getTransactions(address, 'latest', 0, 0)
        console.log(balances, allTransactions.length)
        let uniques = getTotalVol(allTransactions)
        console.log(uniques)
        let totalVol = await parseUniques(uniques)
        console.log('totalVol: ', totalVol)
    }, [address])

    const onAddressFormSubmit = (input) => {
        setTotalVol(0)
        setAddress(input.address)
    }

    async function searchAddress(address) {
        try {
            const res = await fetch(`https://api.zksync.io/api/v0.2/accounts/${address}`);
            const data = await res.json();
            setNonce(data.result.finalized.nonce);
            setInfo(Object.entries(data.result.finalized.balances));
            return Object.entries(data.result.finalized.balances)
        } catch (error) {
            console.log(error);
        }
    }

    const getEthPrice = function (array) {
        for (let i = 0; i < array.length; i++) {
            if (array[i].token == "ETH") {
                setEthPrice(array[i].price)
                return array[i].price
            }
        }
    }

    const parseInfo = (info) => {
        const nodes = info.map(item => {
            total = total + (Number(item.price) * item.balance * 10 ** (0 - item.decimals))
            return <tr>
                <td class="table-item">{item.token}</td>
                <td class="table-item">{(item.balance * 10 ** (0 - item.decimals)).toFixed(2)}</td>
                <td class="financial table-item">{Number(item.price).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
                <td class="financial table-item">{(Number(item.price) * item.balance * 10 ** (0 - item.decimals)).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
            </tr>
        })
        return nodes
    }

    async function getTransactions(address, tx, index, number) {
        setTxNumber(number)
        try {
            console.log('calling getTransactions with tx: ', tx);
            const res = await fetch(`https://api.zksync.io/api/v0.2/accounts/${address}/transactions?from=${tx}&limit=100&direction=older`);
            const data = await res.json();
            const txArray = [];

            for (let i = index; i < data.result.list.length; i++) {
                txArray.push(data.result.list[i]);
            }

            if (data.result.list.length > 99) {
                const r = await getTransactions(address, data.result.list[99].txHash, 1, number + 100);
                return txArray.concat(r);
            } else {
                const r1 = await makeDatas(txArray);
                setDatas(r1);
                const r2 = await getTotalVol(txArray);
                console.log(r2, txArray.length)
                setUniques(r2);
                return txArray;
            }
        } catch (error) {
            console.log(error);
            return [];
        }
    }


    const getTransactionVolume = async function (tx) {
        let txVol = 0;
        let token = tx.token;
        const res = await fetch(`https://api.zksync.io/api/v0.2/tokens/${token}/priceIn/usd`);
        const data = await res.json();

        if (data.status == 'success') {
            let decimal = data.result.decimals;
            let amount = tx.amount;
            let price = data.result.price;
            txVol = amount * 10 ** (0 - decimal) * price;
        }

        return txVol;
    }


    const getTotalVol = function (array) {

        // console.log('calling getTotalVol')

        const uniques = array.reduce((tokensSoFar, currentValue) => {
            if (currentValue.op.type == "Swap") {
                if (currentValue.status == "committed" || currentValue.status == "finalized") {
                    let token = currentValue.op.orders[1].tokenSell
                    let amount = currentValue.op.orders[1].amount
                    if (!tokensSoFar[token]) {
                        tokensSoFar[token] = [];
                        tokensSoFar[token].push(amount);
                    }
                    else {
                        tokensSoFar[token].push(amount)
                    }
                }
            }
            // console.log(tokensSoFar)
            return tokensSoFar
        }, {});

        const keys = Object.keys(uniques);

        let uniqueTxs = []
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i]
            uniqueTxs.push({
                token: key, amount: uniques[key].reduce(
                    (previousValue, currentValue) => Number(previousValue) + Number(currentValue),
                    0
                )
            })
        }
        return uniqueTxs
    }

    const getDecimals = async function (info) {
        const decimalsPromiseArray = [];

        for (let i = 0; i < info.length; i++) {
            let token = info[i][0];
            decimalsPromiseArray.push(getTokenDecimal(token));
        }

        const values = await Promise.all(decimalsPromiseArray);
        setDecimals(values);

        return values;
    }


    const getTokenDecimal = async function (token) {
        const res = await fetch(`https://api.zksync.io/api/v0.2/tokens/${token}/priceIn/usd`);
        const data = await res.json();
        const decimal = data.result.decimals;
        const price = data.result.price;
        return ({ token: token, decimal: decimal, price: price })
    }


    const parsePrices = function (info, decimals) {
        let tokenBalanceDecimalsArray = []
        for (let i = 0; i < info.length; i++) {
            if (info[i][0] == decimals[i].token) {
                tokenBalanceDecimalsArray.push({ token: info[i][0], balance: info[i][1], decimals: decimals[i].decimal, price: decimals[i].price })
            }
        }
        // console.log(tokenBalanceDecimalsArray)
        setAllInfo(tokenBalanceDecimalsArray)
        return (tokenBalanceDecimalsArray)
    }

    const parseUniques = async function (array) {
        let grandTotal = 0;
        let promArray = [];

        for (let i = 0; i < array.length; i++) {
            promArray.push(getTransactionVolume(array[i]));
        }

        const values = await Promise.all(promArray);

        for (let i = 0; i < values.length; i++) {
            grandTotal += values[i];
        }
        setTotalVol(grandTotal);
        return (grandTotal)
    }


    const makeDatas = async function (array) {
        let datas = [];
        for (let i = 0; i < array.length; i++) {
            if (array[i].op.type == "Swap") {
                datas.push({
                    txDate: array[i].createdAt.toString(),
                    txHash: array[i].txHash.toString(),
                    nonce: array[i].op.nonce.toString(),
                    type: array[i].op.type.toString(),
                    BuyToken: array[i].op.orders[0].tokenBuy.toString(),
                    BuyAmount: array[i].op.orders[0].amount.toString(),
                    SellToken: array[i].op.orders[0].tokenSell.toString(),
                    SellAmount: array[i].op.orders[0].amount.toString(),
                    FeeToken: array[i].op.feeToken,
                    FeeAmount: array[i].op.fee
                })
            }
        }
        return datas
    }

    return (
        <><div id="wrap">
            <h1>ZkScanalyzer by DefiBuilder.eth</h1>
            <h3>A <a href="https://trade.zigzag.exchange/">ZigZag</a> Community Project</h3>
            <div id="addressBox">
                <AddressForm onAddressFormSubmit={onAddressFormSubmit} />
                <p id="address">
                    {address ? `Address : ${address}` : null}
                </p>
            </div>
            <div id="resultsArea">
                {address ? <section class="result" id="transactions">Transactions: {nonce} </section> : null}
                {txNumber ? <section class="result">Loading volume: Transactions {txNumber} to {Math.min(txNumber + 100, nonce)} of {nonce}</section> : null}
                {totalVol ? <section id="volume" class="result">Ballpark Volume: {totalVol.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    <h5>Note - not accurate! Volume is ballparked at today's prices</h5>
                    <CsvDownloader datas={datas} filename="info" prefix={true}>
                        <button>Download Transaction Info CSV</button>
                    </CsvDownloader></section> : null}
            </div>

            {allInfo ? <table class="result">
                <tr>
                    <th>Token</th>
                    <th>Balance</th>
                    <th>Price</th>
                    <th>Value</th>
                </tr>
                {parseInfo(allInfo)} </table>
                : null}
            <h2 id="myID">{total ? `Total Balance: ${total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}, or ${(total / ethPrice).toFixed(2)} ETH` : null}</h2>
        </div>
        </>
    )
}

export default ZkscanContainer;