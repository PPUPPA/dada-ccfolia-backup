import React from 'react';
import { GlobalStyle } from './styles/global';
import Converter from './pages/Converter';

const App: React.FC = () => {
  return (
    <>
      <GlobalStyle />
      <Converter />
    </>
  );
};

export default App;
