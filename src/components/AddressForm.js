import React from "react";
import { useForm } from "react-hook-form";

export default function AddressForm({ onAddressFormSubmit }) {
    const { register, handleSubmit, watch, formState: { errors } } = useForm();
    const onSubmit = data => onAddressFormSubmit(data);


    return (
        <form id="addressForm" onSubmit={handleSubmit(onSubmit)}>
            <input id="add" size="50" placeholder="Address" {...register("address", {
                required: true, pattern: {
                    value: /^0x[a-fA-F0-9]{40}$/,
                    message: "invalid eth address"
                }
            })} />
            <button class="button-36" name="name" value="value" type="submit">Go!</button>
        </form>
    );
}