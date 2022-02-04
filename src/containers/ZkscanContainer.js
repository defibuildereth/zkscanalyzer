import React, { useState, useEffect } from 'react';
import AddressForm from '../components/AddressForm';

const ZkscanContainer = () => {

    const [address, setAddress] = useState("");
    const [info, setInfo] = useState("");
    const [decimals, setDecimals] = useState([]);
    const [allInfo, setAllInfo] = useState([])
    const [total, setTotal] = useState("")

    useEffect(() => {
        searchAddress(address)
    }, [address])

    useEffect(() => {
        // console.log(info)
        getDecimals(info)
    }, [info])

    useEffect(() => {
        parsePrices(info, decimals)
    }, [decimals])

    

    const onAddressFormSubmit = (submittedAddress) => {
        console.log('Address Submitted: ', submittedAddress)
        setAddress(submittedAddress.submittedAddress)
    }

    const searchAddress = (address) => {
        fetch(`https://api.zksync.io/api/v0.2/accounts/${address}`)
            .then((res) => res.json())
            .then(data => setInfo(Object.entries(data.result.finalized.balances)))
    }

    const parseInfo = (info) => {
        let total = 0;
        const nodes = info.map(item => {
            console.log(total)
            total = total+(Number(item.price)*item.balance*10**(0-item.decimals))
            // total += (Number(item.price)*item.balance*10**(0-item.decimals))
            return <p>Token: {item.token} Balance: {(item.balance*10**(0-item.decimals)).toFixed(2)} Price: {Number(item.price).toFixed(2)} Value:{(Number(item.price)*item.balance*10**(0-item.decimals)).toFixed(2)}</p>
        })
        console.log('final total: ', total)
        // setTotal(total)
        return nodes
    }

    const getDecimals = async function (info) {
        let decimalsPromiseArray = []

        for (let i = 0; i < info.length; i++) {
            let token = info[i][0];
            decimalsPromiseArray.push(getTokenDecimal(token))
        }

        // console.log('decimals promise array: ', decimalsPromiseArray)

        await Promise.all(decimalsPromiseArray)
            .then((values) => {
                console.log('promise array result: ', values)
                setDecimals(values)
            }
            )
    }

    const getTokenDecimal = async function (token) {
        let decimal;
        let price;
        console.log('query: ', `https://api.zksync.io/api/v0.2/tokens/${token}/priceIn/usd`)
        await fetch(`https://api.zksync.io/api/v0.2/tokens/${token}/priceIn/usd`)
            .then((res) => res.json())
            .then(data => {
                // console.log('get decimal result: ', token, data.result.decimals)
                decimal = data.result.decimals;
                price = data.result.price;
            })

        return ({ token: token, decimal: decimal, price: price })
    }

    const parsePrices = function (info, decimals) {
        console.log(info)
        console.log(decimals)
        let tokenBalanceDecimalsArray = []
        for (let i = 0; i < info.length; i++) {
            if (info[i][0] == decimals[i].token) {
                tokenBalanceDecimalsArray.push({ token: info[i][0], balance: info[i][1], decimals: decimals[i].decimal, price: decimals[i].price })
            }
        }
        console.log(tokenBalanceDecimalsArray)
        setAllInfo(tokenBalanceDecimalsArray)
    }


    return (
        <>
            <h3>zkscan container</h3>
            <AddressForm onAddressFormSubmit={onAddressFormSubmit} />
            <h2>{address ? address : null}</h2>
            {allInfo ? <section>
                {parseInfo(allInfo)}
            </section> : null}
        </>
    )

}

export default ZkscanContainer;