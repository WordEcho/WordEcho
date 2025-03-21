import React from 'react';
import { Box, Typography, Link } from "@mui/material";
import SettingsIcon from '@mui/icons-material/Settings';

function TextList(props) {
	const { id, link, title, newCount, seenCount, knownCount }= props;

	return (
		<Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', alignItems: 'center', backgroundColor: '#191919', margin: 1, borderRadius: '12px', padding: 0.1, paddingTop: 0.1, paddingLeft: 2 }}>
				<Link href={link} sx={{ color: '#f5f5f5', fontSize: '15px' }}> {title} </Link>

				<Typography variant='body1' sx={{ minWidth: {xs:'50px', sm:'55px'}, color: '#909FAF', textAlign: 'center'}}> {newCount} </Typography>
				<Typography variant='body1' sx={{ minWidth: {xs:'50px', sm:'55px'}, color: '#dddddd', textAlign: 'center'}}> {seenCount} </Typography>
				<Typography variant='body1' sx={{ minWidth: {xs:'50px', sm:'55px'}, color: '#dddddd', textAlign: 'center', marginRight: {xs:'10px', sm:'20px'}}}> {knownCount} </Typography>
				
				<Link href={`/edit/${id}`} sx={{ fontSize: '0px', margin: 0, padding: 0, alignContent: 'center', marginRight: 1 }}>
					<SettingsIcon sx={{ fontSize:'20px', padding: 0, margin: 0, color: '#666'}} />
				</Link>
		</Box>
	);
}

export default TextList;