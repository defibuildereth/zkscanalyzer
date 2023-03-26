import './App.css';
import Footer from './components/Footer';
import ZkscanContainer from "./containers/ZkscanContainer";
import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";
import Results from './components/Results';
import Layout from './components/Layout';

function App() {
  return (<>
    <Router>
      <Layout>
        <Switch>
          <Route exact path="/" component={null} />
          <Route exact path="/:address" component={Results} />
        </Switch>
      </Layout>
    </Router>
  </>
  );
}

export default App;
