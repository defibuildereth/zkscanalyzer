import './App.css';
import Footer from './components/Footer';
import ZkscanContainer from "./containers/ZkscanContainer";
import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";
import Home from './components/Home';
import Results from './components/Results';

function App() {
  return (<>
    <Router>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route exact path="/:address" component={Results} />
      </Switch>
    </Router>
    <Footer></Footer>
  </>
  );
}

export default App;
