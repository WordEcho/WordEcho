import React from 'react';
import { Box, Typography, Link, IconButton } from "@mui/material";
import DeleteIcon from '@mui/icons-material/DeleteForever';
import { invoke } from '@tauri-apps/api/core';

function TextList(props) {
	const { id, word, status, meaning, stability, difficulty, nextReviewDate, onDelete }= props;

	// calculates remaining days until the next review date
    const calculateDaysRemaining = (nextReviewDate) => {
        if (!nextReviewDate) return "";

        const today= new Date();
        const nextReview= new Date(nextReviewDate);
        const timeDifference= nextReview -today;
        const daysDifference= Math.ceil(timeDifference /(1000 *60 *60 *24));

        return daysDifference;
    };

    const daysRemaining= calculateDaysRemaining(nextReviewDate);

	// deletes the selected word from database
	// may be useful if the user doesn't want to learn that word
	async function deleteWord(wordId) {
		try{
			await invoke('delete_word', { wordId });
			console.log(`Word with ID ${wordId} deleted successfully`);
			onDelete();
		}
		catch(error){
			console.error(`Failed to delete word: ${error}`);
		}
	}

	return (
		<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto auto auto', alignItems: 'center', backgroundColor: '#191919', margin: 0.5, borderRadius: '5px', padding: 0.1, paddingTop: 0.1, paddingLeft: 2 }}>
				<Box sx={{ display: 'flex' }} >
					<Typography variant='body1' sx={{ color: '#f5f5f5', }} > {word} </Typography>
				</Box>
				<Typography variant='body1' sx={{ color: '#f5f5f5' }} > {meaning} </Typography>

				<Typography variant='body1' sx={{ minWidth: {xs:'30px', sm:'55px'} , color: '#909FAF', textAlign: 'center'}}> {(status == 'seen') ? stability.toFixed(1): ""} </Typography>
				<Typography variant='body1' sx={{ minWidth: {xs:'30px', sm:'55px'}, color: '#dddddd', textAlign: 'center'}}> {(status == 'seen') ? difficulty.toFixed(1): ""} </Typography>
				<Typography variant='body1' sx={{ minWidth: {xs:'27px', sm:'55px'}, color: '#dddddd', textAlign: 'center', marginRight: {xs:'0px', sm:'20px'}}}> {daysRemaining} </Typography>
				
				<IconButton sx={{ fontSize: '0px', margin: 0, padding: 0, alignContent: 'center', marginRight: 1 }} onClick={()=> deleteWord(id)} >
					<DeleteIcon sx={{ fontSize:'20px', padding: 0, margin: 0, color: '#666'}} />
				</IconButton>
		</Box>
	);
}

export default TextList;