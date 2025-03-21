import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import ReadT from '../components/ReadComponent';
import { Box } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';

function Read() {
	const { id }= useParams();
	const [text, setText]= useState(null);
  const [words, setWords]= useState([]);
  const [selectedWord, setSelectedWord]= useState(null);

  // get words from database
  useEffect(()=> {
    const fetchData= async()=> {
      try{
        const result= await invoke('get_text_with_words', { id: parseInt(id, 10) });
        setText(result[0]);
        setWords(result[1]);
      }
      catch(error){
        console.error('Error fetching text:', error);
      }
    };

    fetchData();
  }, [id]);

  // refetch words from database after a change
  const updateWords= async()=> {
    try{
        const result= await invoke('get_text_with_words', { id: parseInt(id, 10) });
        setWords(result[1]);
    }
    catch(error){
        console.error('Error refreshing words:', error);
    }
  };

  // loading screen
  if(!text){
    return (
      <Box sx={{ textAlign: 'center', marginTop: '25%' }} >
        <CircularProgress sx={{ color: '#aaaaaa' }} />
      </Box>
    );
  }

	return (
		<div>
			<ReadT
				title={text.title}
				textblock={text.content}
        words={words}
				selectedWord={selectedWord}
				setSelectedWord={setSelectedWord}
        updateWords={updateWords} 
			/>
		</div>
	);
}

export default Read;