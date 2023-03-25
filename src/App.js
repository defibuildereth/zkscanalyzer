import './App.css';
import Footer from './components/Footer';
import ZkscanContainer from "./containers/ZkscanContainer";
import {
  BrowserRouter as Router,
  Routes,
  Route
} from "react-router-dom";
import Home from './components/Home';

function App() {
  return (<>
    {/* <ZkscanContainer /> */}
    <Home></Home>
    <Footer></Footer>
  </>
  );
}

export default App;
