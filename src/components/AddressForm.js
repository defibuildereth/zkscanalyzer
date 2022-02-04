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
            <form onSubmit={handleAddressSubmit}>
                <input
                    type="text"
                    placeholder="Address"
                    value={submittedAddress}
                    onChange={handleAddressChange}
                />
                <input
                    type="submit"
                    value="Search"
                />
            </form>
        </>
    )

}

export default AddressForm