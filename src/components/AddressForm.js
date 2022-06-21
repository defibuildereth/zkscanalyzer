import React, { useState } from "react";

const AddressForm = ({ onAddressFormSubmit }) => {

    const [submittedAddress, setSubmittedAddress] = useState("")

    const handleAddressChange = (evt) => {
        setSubmittedAddress(evt.target.value);
    }

    const handleAddressSubmit = (evt) => {
        evt.preventDefault();
        const addressToSubmit = submittedAddress.trim();
        if (!addressToSubmit) {
            return
        }

        onAddressFormSubmit({
            submittedAddress: addressToSubmit,
        });
        setSubmittedAddress("");
    }

    return (
        <>
        <h4>Enter a valid address to get started</h4>
            <form onSubmit={handleAddressSubmit} id="addressForm">
                <input
                    type="text"
                    id="add"
                    placeholder="Address"
                    value={submittedAddress}
                    onChange={handleAddressChange}
                />
                <button class="button-36" name="name" value="value" type="submit">Go!</button>
            </form>
        </>
    )

}

export default AddressForm