import React, { useEffect, useState } from 'react';
import { Box, Typography, Divider, CircularProgress, useMediaQuery, useTheme } from '@mui/material';
import WordList from "/src/components/WordList"
import { invoke } from '@tauri-apps/api/core';

function Vocab() {
    const [words, setWords]= useState([]);
    const [isLoading, setIsLoading]= useState(true);
    const theme= useTheme();
    const isMobile= useMediaQuery(theme.breakpoints.down('sm'));

    // fetch all words from the backend
    const fetchWords= async()=> {
        try{
            const data= await invoke('get_all_words');
            setWords(data);
        }
        catch(error){
            console.error("Failed to fetch words:", error);
        }
        finally{
            setIsLoading(false); // mark loading as complete
        }
    };

    useEffect(() => {
        fetchWords();
    }, []);

    if(isLoading){
        return (
        <Box sx={{ textAlign: 'center', marginTop: '25%' }} >
            <CircularProgress sx={{ color: '#aaaaaa' }} />
        </Box>
        );
    }

	return (
		<Box sx={{ display: 'flex', justifyContent: 'center'}} >
		<Box sx={{ padding: {xs:0, sm:2}, margin: 1, width: '800px', backgroundColor: '#202020', marginTop: 2.5, borderRadius: '15px' }}>
			<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto auto auto', marginLeft: {xs:'20px', sm:'30px'}, marginRight: {xs:'30px', sm:'65px'}, marginTop: {xs:'15px', sm:0} }}>
				<Box sx={{ display: 'flex' }}>
					<Typography variant='body1' sx={{ fontWeight: 'bold', backgroundColor: '' }} >Words</Typography>
				</Box>
					<Typography variant='body1' sx={{ fontWeight: 'bold', backgroundColor: '' }} >Meaning</Typography>
				<Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'flex-end' }}>
					<Typography variant='body1' sx={{ fontWeight: 'bold' }} >{isMobile ? 'LvL' : 'Level'}</Typography>
					<Typography variant='body1' sx={{ marginLeft: {xs:'5px', sm:'17px'}, fontWeight: 'bold' }} >{isMobile ? 'Fog' : 'Haze'}</Typography>
					<Typography variant='body1' sx={{ marginLeft: {xs:'5px', sm:'15px'}, fontWeight: 'bold' }} >{isMobile ? 'Due' : 'Days'}</Typography>
				</Box>
			</Box>
			<Divider sx={{ borderColor: '#131313' }} variant='middle' />
			<Box sx={{ marginTop: {xs:1, sm:3 } }}>
			{words.map((word) => (
                        <WordList
                            id={word.id}
                            word={word.word}
                            meaning={word.meaning}
                            status={word.status}
                            stability={word.stability}
                            difficulty={word.difficulty}
                            nextReviewDate={word.next_review_date}
							onDelete={fetchWords}
                        />
                    ))}
			</Box>
		</Box>
		</Box>
	);
}

export default Vocab;