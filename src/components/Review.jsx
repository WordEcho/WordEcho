import React, { useState, useEffect  } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Box, Typography, Button, Divider } from "@mui/material";

function Review(){
    const [showAnswer, setShowAnswer]= useState(false);
    const [randomWord, setRandomWord]= useState(null);
	const [hasRemainingWords, setHasRemainingWords] = useState(true);

	// fetches word to review
    const fetchWord2Review= async()=> {
        try{
            const word= await invoke('get_random_word');
            setRandomWord(word);
            setShowAnswer(false);
            setHasRemainingWords(true);
        }
		catch(error){
            console.error('Error fetching random word:', error);

            if(error=== "No words are due for review"){
                console.log("No more words available for review.");
                setHasRemainingWords(false);
            }
			else{
                console.error('Unexpected error:', error);
            }
        }
    };

    useEffect(()=> {
        fetchWord2Review();
    }, []);

    const handleShowAnswer= ()=> {
        setShowAnswer(!showAnswer);
    };

	// handles user's rating for current word
	const handleRatingClick= async(rating)=> {
		if(!randomWord) return;
	
		try{
			await invoke('review_word', {
				wordId: randomWord.id,
				rating: rating,
			});
			fetchWord2Review();
		}
		catch(error){
			console.error('Error reviewing word:', error);
		}
	};

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' ,padding: 2, }}>
		{!hasRemainingWords ? (
			<Box sx={{ textAlign: 'center', backgroundColor: '#131313', padding: 2, width: '60%', marginLeft: '20%', height: '30%', }}>
				<Typography variant='h5'> No words available for review. </Typography>
			</Box>
		) : (
			<Box>

			<Box sx={{ textAlign: 'center', backgroundColor: '#131313', padding: 2, width: '60%', marginLeft: '20%', height: '30%', }}>
				<Typography variant='h5'> {randomWord ? randomWord.word : "Loading..."} </Typography>
				{/* <Typography variant='h6' sx={{ fontStyle: 'italic', lineHeight: 3 }} >Die Hausfrau wäscht, kocht und kauft ein. </Typography> */}
			</Box>

			{showAnswer && (
				<Box sx={{ marginTop: '5%' }} >
				<Divider sx={{ borderColor: '#dddddd' }} variant='middle' />
				<Box sx={{ textAlign: 'center', backgroundColor: '#131313', padding: 2, width: '60%', marginLeft: '20%', height: '30%', marginTop: '5%'  }}>
				<Typography variant='h5'> {randomWord?.meaning || '---'} </Typography>
				{/* <Typography variant='h6' sx={{ fontStyle: 'italic', lineHeight: 3 }} >The housewife washes, cooks and shops. </Typography> */}
				</Box>
				</Box>
			)}
			
			<Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, display:'flex', backgroundColor: '#202020', padding: 2, alignItems: 'center', justifyContent: 'center'}}>
				<Button size='small' variant='contained' sx={{ backgroundColor: '#262626', borderRadius: '7px', fontSize: '12px' }} onClick={handleShowAnswer} >Show Answer</Button>
			</Box>
			{showAnswer && (
				<Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, display:'flex', backgroundColor: '#202020', padding: 2, alignItems: 'center', justifyContent: 'center'}}>
				<Box>
				<Button size='small' variant='contained' sx={{ backgroundColor: '#262626', fontSize: '12px' }} onClick={()=> handleRatingClick('Again')} >cant</Button>
				<Button size='small' variant='contained' sx={{ backgroundColor: '#262626', marginLeft: 2, fontSize: '12px' }} onClick={()=> handleRatingClick('Hard')} >hard</Button>
				<Button size='small' variant='contained' sx={{ backgroundColor: '#262626', marginLeft: 2, fontSize: '12px' }} onClick={()=> handleRatingClick('Good')} >good</Button>
				<Button size='small' variant='contained' sx={{ backgroundColor: '#262626', marginLeft: 2, fontSize: '12px' }} onClick={()=> handleRatingClick('Easy')} >easy</Button>
				</Box>
				</Box>
			)}
			</Box>
		)}
		</Box>
	);
}

export default Review;