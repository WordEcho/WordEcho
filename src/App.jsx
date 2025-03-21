import React from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Home from './pages/Home';
import Read from './pages/Read';
import Study from './pages/Study';
import Edit from './pages/Edit';
import New from './pages/New';
import Vocab from './pages/Vocab';
import Navbar from './components/Navbar';

const theme= createTheme({	//mui theme
	palette: {
		primary: {
			main: '#202020',
			contrastText: '#f5f5f5'
		},
		background: {
			default: '#131313',
		},
		text: {
			primary: '#f5f5f5',
		}
	},
});

/*
Color Palette

#f5f5f5	text
#aaaaaa	icon
#131313	background
#191919	list
#202020	foreground
#262626	rightpanel
#303030	inputbox

#dddddd	color-default
#909FAF	color-new
#dddddd	color-seen
#dddddd	color-known
*/

function App() {
	return (
		<ThemeProvider theme={theme}>
		<CssBaseline/>
			<Router>
				<Navbar/>
				<div style={{ marginTop: '30px' }} >
					<Routes>
						<Route path="/" element={<Home />} />
						<Route path="/read/:id" element={<Read />} />
						<Route path="/study" element={<Study />} />
						<Route path="/edit/:id" element={<Edit />} />
						<Route path="/new" element={<New />} />
						<Route path="/vocab" element={<Vocab />} />
					</Routes>
				</div>
			</Router>
		</ThemeProvider>
	);
}
	
export default App;