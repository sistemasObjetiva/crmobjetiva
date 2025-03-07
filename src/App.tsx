import React , { Suspense }from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { routes } from './config/variables';

const LoginPage = React.lazy(() => import('./pages/LoginPage'));

function App() {
  return (
    <Router>
      <Suspense fallback={<div></div>}>
        <Routes>
        <Route path="/" element={<LoginPage />} />
        {routes.map((route, index) => (
            <Route key={index} path={route.path} element={<route.element />} />
          ))}
        </Routes>
      </Suspense>
    </Router>
  );
}


export default App;
