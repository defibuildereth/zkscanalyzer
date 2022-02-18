import React, { useState, useEffect } from 'react';
import AddressForm from '../components/AddressForm';

const ZkscanContainer = () => {

    let total = 0;
    let roughVol = 0;
    let txArray = [];


    const [address, setAddress] = useState("");
    const [info, setInfo] = useState("");
    const [decimals, setDecimals] = useState([]);
    const [allInfo, setAllInfo] = useState([]);
    const [nonce, setNonce] = useState("");
    const [totalVol, setTotalVol] = useState(0)

    useEffect(() => {
        searchAddress(address)
    }, [address])

    useEffect(() => {
        getDecimals(info)
        // console.log(nonce)
        getTransactions(address, 'latest', 0)
    }, [info])

    useEffect(() => {
        parsePrices(info, decimals)
    }, [decimals])


    const onAddressFormSubmit = (submittedAddress) => {
        setAddress(submittedAddress.submittedAddress)
    }

    const searchAddress = (address) => {
        fetch(`https://api.zksync.io/api/v0.2/accounts/${address}`)
            .then((res) => res.json())
            .then(data => {
                // console.log(data)
                setNonce(data.result.finalized.nonce)
                setInfo(Object.entries(data.result.finalized.balances))
            })
    }

    const parseInfo = (info) => {
        const nodes = info.map(item => {
            total = total + (Number(item.price) * item.balance * 10 ** (0 - item.decimals))
            // total += (Number(item.price)*item.balance*10**(0-item.decimals))
            return <p>Token: {item.token} Balance: {(item.balance * 10 ** (0 - item.decimals)).toFixed(2)} Price: {Number(item.price).toFixed(2)} Value:{(Number(item.price) * item.balance * 10 ** (0 - item.decimals)).toFixed(2)}</p>
        })
        // console.log('final total: ', total);
        // setTotal(total)
        return nodes
    }

    const getTransactions = async function (address, tx, index) {

        console.log('calling getTransactions with tx: ', tx)
        // console.log('hitting getTransactions: ', nonce, address)
        await fetch(`https://api.zksync.io/api/v0.2/accounts/${address}/transactions?from=${tx}&limit=100&direction=older`)
            .then((res) => res.json())
            .then(data => {
                for (let i = index; i < data.result.list.length; i++) {
                    // console.log(data.result.list[i])
                    // txArray.push(data.result.list[i])
                    txArray.push(data.result.list[i])
                }

                if (data.result.list.length > 99) {
                    getTransactions(address, data.result.list[99].txHash, 1)
                } else {
                    getTotalVol(txArray)
                }
            })
    }


    const getTransactionVolume = async function (tx) {
        let txVol = 0;
        if (tx.op.type == 'Swap') {
            // console.log(tx)
            // console.log('amount: ',tx.op.orders[1].amount)
            let token = tx.op.orders[1].tokenSell
            await fetch(`https://api.zksync.io/api/v0.2/tokens/${token}/priceIn/usd`)
                .then((res) => res.json())
                .then(data => {
                    // console.log(data)
                    let decimal = data.result.decimals;
                    let amount = tx.op.orders[1].amount;
                    let price = data.result.price;
                    txVol = amount * 10 ** (0 - decimal) * price
                    // console.log(roughVol)
                })
            return txVol
        }
    }

    const getTotalVol = async function (array) {
        let volPromiseArray = []

        for (let i = 0; i < array.length; i++) {
            volPromiseArray.push(getTransactionVolume(array[i]))
        }

        await Promise.all(volPromiseArray)
            .then((values) => {
                let grandTotal = 0;
                console.log('values.length: ', values.length)
                for (let i = 0; i < values.length; i++) {
                    if (values[i]) {
                        grandTotal = grandTotal + values[i]

                    }
                    console.log(grandTotal)
                }

                setTotalVol(grandTotal)
            })

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


    return (
        <>
            <h1>ZkScanalyzer by DefiBuilder.eth</h1>
            <AddressForm onAddressFormSubmit={onAddressFormSubmit} />
            <h2>{address ? address : null}</h2>
            <h2>{address ? `Transactions: ${nonce}` : null}</h2>
            <h2>{totalVol ? `Ballpark Volume: $${totalVol.toFixed(2)}` : null}</h2>

            {allInfo ? <section>
                {parseInfo(allInfo)}
            </section> : null}
            {total ? <h3 id="myID">${total.toFixed(2)}</h3> : null}

        </>
    )

}

export default ZkscanContainer;