import React, { useState, useEffect } from 'react';
import AddressForm from '../components/AddressForm';

const ZkscanContainer = () => {

    const [address, setAddress] = useState("")

    const onAddressFormSubmit = (submittedAddress) => {
        console.log('Address Submitted: ', submittedAddress)
        setAddress(submittedAddress.submittedAddress)
    }

    return (
        <>
            <h3>zkscan container</h3>
            <AddressForm onAddressFormSubmit={onAddressFormSubmit}/>
            <p>{address ? address: null}</p>
        </>
    )

}

export default ZkscanContainer;