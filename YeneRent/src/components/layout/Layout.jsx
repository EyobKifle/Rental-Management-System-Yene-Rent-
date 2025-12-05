import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header'; // Assuming Header.jsx exists in the same directory
import Sidebar from './Sidebar'; // Assuming Sidebar.jsx exists in the same directory
import '../layout/Layout.css'; // Import the layout-specific CSS

const Layout = () => {
  return (
    <div className="layout-container">
      <Sidebar />
      <div className="main-content-wrapper">
        <Header />
        <main className="main-content">
          <Outlet /> {/* This is where child routes will be rendered */}
        </main>
      </div>
    </div>
  );
};

export default Layout;
