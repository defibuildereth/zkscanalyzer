import React, {useState, useEffect} from "react";
import Footer from "./Footer";
import AddressForm from "./AddressForm";
import { useParams, useHistory, Link } from 'react-router-dom';


const Layout = ({ children }) => {

    const [address, setAddress] = useState("");
    const [totalVol, setTotalVol] = useState(0);

    const history = useHistory();

    const onAddressFormSubmit = (input) => {
        setTotalVol(0);
        setAddress(input.address);
        history.push(`/${input.address}`);
    };

    return (<>
        <header className='header'>
            <Link to='/'></Link>
        </header>
        <h1>ZkScanalyzer by DefiBuilder.eth</h1>
        <h3>A <a href="https://trade.zigzag.exchange/">ZigZag</a> Community Project</h3>
        <AddressForm onAddressFormSubmit={onAddressFormSubmit}></AddressForm>
        <main>{children}</main>
        <Footer></Footer>
    </>)
}

export default Layout;