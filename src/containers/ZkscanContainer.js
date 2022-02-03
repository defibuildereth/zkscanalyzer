import React, { useState, useEffect } from 'react';
import AddressForm from '../components/AddressForm';

const ZkscanContainer = () => {


    const [address, setAddress] = useState("");
    const [info, setInfo] = useState("");

    useEffect(() => {
        searchAddress(address)
    }, [address])

    useEffect(() => {
        console.log(info)
        // console.log(Object.entries(info))
    }, [info])


    const onAddressFormSubmit = (submittedAddress) => {
        console.log('Address Submitted: ', submittedAddress)
        setAddress(submittedAddress.submittedAddress)
    }

    const searchAddress = (address) => {
        fetch(`https://api.zksync.io/api/v0.2/accounts/${address}`)
            .then((res) => res.json())
            .then(data => setInfo(Object.entries(data.result.finalized.balances)))
    }


    const nodes = info.map(item => {
        return <p>Token: {item[0]} Balance: {item[1]}</p>
    })

    return (
        <>
            <h3>zkscan container</h3>
            <AddressForm onAddressFormSubmit={onAddressFormSubmit} />
            <h2>{address ? address : null}</h2>
            <p>{info ? <section>
                {nodes}
            </section> : null}</p>
        </>
    )

}

export default ZkscanContainer;