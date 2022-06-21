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

    useEffect(() => {
        searchAddress(address)
    }, [address])

    useEffect(() => {
        getDecimals(info)
        getTransactions(address, 'latest', 0, 0)
    }, [info])

    useEffect(() => {
        parsePrices(info, decimals)
    }, [decimals])

    useEffect(() => {
        getEthPrice(allInfo)
    }, [allInfo])

    useEffect(() => {
        parseUniques(uniques)
    }, [uniques])

    const onAddressFormSubmit = (submittedAddress) => {
        setTotalVol(0)
        setAddress(submittedAddress.submittedAddress)
    }

    const searchAddress = (address) => {
        fetch(`https://api.zksync.io/api/v0.2/accounts/${address}`)
            .then((res) => res.json())
            .then(data => {
                setNonce(data.result.finalized.nonce)
                setInfo(Object.entries(data.result.finalized.balances))
            })
    }

    const getEthPrice = async function (array) {
        for (let i = 0; i < array.length; i++) {
            if (array[i].token == "ETH") {
                setEthPrice(array[i].price)
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

    const getTransactions = async function (address, tx, index, number) {

        console.log('calling getTransactions with tx: ', tx)
        await fetch(`https://api.zksync.io/api/v0.2/accounts/${address}/transactions?from=${tx}&limit=100&direction=older`)
            .then((res) => res.json())
            .then(data => {
                for (let i = index; i < data.result.list.length; i++) {
                    txArray.push(data.result.list[i])
                }

                if (data.result.list.length > 99) {
                    setTxNumber(number)
                    getTransactions(address, data.result.list[99].txHash, 1, number + 100)
                } else {
                    setTxNumber(0)
                    makeDatas(txArray)
                        .then((r) => {
                            setDatas(r)
                        })
                    // console.log(datas)
                    getTotalVol(txArray)
                        // console.log(txArray)
                        .then((r) => {
                            setUniques(r)
                        })
                }
            })
    }

    const getTransactionVolume = async function (tx) {
        let txVol = 0;
        let token = tx.token
        await fetch(`https://api.zksync.io/api/v0.2/tokens/${token}/priceIn/usd`)
            .then((res) => res.json())
            .then(data => {
                if (data.status == 'success') {
                    let decimal = data.result.decimals;
                    let amount = tx.amount;
                    let price = data.result.price;
                    txVol = amount * 10 ** (0 - decimal) * price
                }

            })
        return txVol
    }

    const getTotalVol = async function (array) {

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
        console.log(uniqueTxs)
        return uniqueTxs
    }

    const getDecimals = async function (info) {
        let decimalsPromiseArray = []

        for (let i = 0; i < info.length; i++) {
            let token = info[i][0];
            decimalsPromiseArray.push(getTokenDecimal(token))
        }

        await Promise.all(decimalsPromiseArray)
            .then((values) => {
                setDecimals(values)
            }
            )
    }

    const getTokenDecimal = async function (token) {
        let decimal;
        let price;
        await fetch(`https://api.zksync.io/api/v0.2/tokens/${token}/priceIn/usd`)
            .then((res) => res.json())
            .then(data => {
                decimal = data.result.decimals;
                price = data.result.price;
            })

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
    }

    const parseUniques = async function (array) {
        // console.log('calling parseUniques')
        let grandTotal = 0
        let promArray = []
        for (let i = 0; i < array.length; i++) {
            promArray.push(getTransactionVolume(array[i]))
        }

        await Promise.all(promArray)
            .then((values) => {
                console.log('values', values)
                for (let i = 0; i < values.length; i++) {
                    grandTotal += values[i]
                }
                setTotalVol(grandTotal)
            })
    }

    const makeDatas = async function (array) {
        let datas = [];
        console.log(array)
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