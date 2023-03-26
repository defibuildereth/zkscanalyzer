import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import AddressForm from '../components/AddressForm';
// import Results from '../components/Results';


const Home = ({ }) => {

    const [address, setAddress] = useState("");
    const [totalVol, setTotalVol] = useState(0);

    const history = useHistory();

    const onAddressFormSubmit = (input) => {
        setTotalVol(0)
        setAddress(input.address)
        history.push(`/${address}`);
    }

    return (
        <>
            <h1>ZkScanalyzer by DefiBuilder.eth</h1>
            <h3>A <a href="https://trade.zigzag.exchange/">ZigZag</a> Community Project</h3>
            <div id="addressBox">
                <AddressForm onAddressFormSubmit={onAddressFormSubmit} />
                <p id="address">
                    {address ? `Address : ${address}` : null}
                </p>
                {/* {address? <Results address={address}></Results> : null} */}
            </div>
        </>
    )
}

export default Home