import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import Account from "../pages/Account";
import Transactions from "../pages/Transactions";
import Performance from "../pages/Performance";
import Settings from "../pages/Settings";
import Private from "./Private";

export default function RoutesApp() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/Login" element={<Login />} />
      <Route path="/Register" element={<Register />} />
      <Route
        path="/Dashboard"
        element={
          <Private>
            <Dashboard />
          </Private>
        }
      />
      <Route
        path="/account"
        element={
          <Private>
            <Account />
          </Private>
        }
      />
      <Route
        path="/transactions/:type"
        element={
          <Private>
            <Transactions />
          </Private>
        }
      />
      <Route
        path="/performance/"
        element={
          <Private>
            <Performance />
          </Private>
        }
      />
      <Route
        path="/settings/"
        element={
          <Private>
            <Settings />
          </Private>
        }
      />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
