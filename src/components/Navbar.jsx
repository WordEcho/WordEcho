import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useNavigate } from "react-router-dom";
import ImageDropdown from './ImageDropdown.jsx';

function Navbar(){
	const navigate= useNavigate();

	return (
		<AppBar position="fixed" sx={{ margin: 0, padding: 0 }}>
			<Toolbar variant='' disableGutters >
				<Typography variant="h6" color="inherit" component="div" sx={{ flexGrow: 1 }}>
					<Button color="inherit" size='small' onClick={() => navigate("/")} disableRipple>Read</Button>
					<Button color="inherit" size='small' onClick={() => navigate("/study")} disableRipple>Study</Button>
					<Button color="inherit" size='small' onClick={() => navigate("/vocab")} disableRipple>Vocab</Button>
				</Typography>
				<ImageDropdown/>
			</Toolbar>
		</AppBar>
	);
}
export default Navbar;