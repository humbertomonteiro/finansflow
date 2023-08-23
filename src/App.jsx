import './App.css';
import { BrowserRouter } from 'react-router-dom';
import Header from './components/Header';
import RoutesApp from './routes';
import UserProvider from './contexts/user';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import FormAdd from './components/FormAdd';
import Aos from 'aos'
import 'aos/dist/aos.css'
import { useEffect } from 'react';

function App() {

  useEffect(() => {
    Aos.init({ duration: 800 })
  }, [])

  return (
    <BrowserRouter>
      <UserProvider>
        <ToastContainer autoClose={3000} />
        <Header />
        <RoutesApp />
        <FormAdd />
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;
