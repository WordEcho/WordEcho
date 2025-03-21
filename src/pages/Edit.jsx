import React, { useState, useEffect } from 'react';
import { TextField, Box, Button, Link } from '@mui/material';
import { invoke } from '@tauri-apps/api/core';
import { useParams } from 'react-router-dom';

function Edit() {
  const { id }= useParams();
  const [title, setTitle]= useState('');
  const [content, setContent]= useState('');

  // fetches the text and loads the content from database
  useEffect(()=> {
    const fetchText= async()=> {
      if(id){
        try{
          const result= await invoke('get_text_by_id', { id: parseInt(id, 10) });
          if(result){
            setTitle(result.title);
            setContent(result.content);
          }
          else{
            console.error('Text not found');
          }
        }
        catch(error){
          console.error('Error fetching text:', error);
        }
      }
    };

    fetchText();
  }, [id]);

  // saves the edited content and saves newly added words
  const handleSave= async()=> {
    try{
      if(id){
        await invoke('update_text', { id: parseInt(id, 10), title, content });
      }
      else{
        const newText= await invoke('create_text', { title, content });
        console.log('New text added:', newText);
      }
      setTitle('');
      setContent('');
    }
    catch(error){
      console.error('Error saving text:', error);
    }
  };

  // deletes the current text
  const handleDelete= async ()=> {
    try{
      if(id){
        await invoke('delete_text', { textId: parseInt(id, 10) });
      }
    }
    catch(error){
      console.error('Error deleting text:', error);
    }
  };

	return (
    <Box sx={{ padding: 1, display: 'flex', justifyContent: 'center'}} >
      <Box sx={{ display: 'flex', flexDirection: 'column', backgroundColor: '#202020', borderRadius: '5px', padding: 1, marginTop: 1.5, justifyContent: 'center', width: '800px'}}>
        <TextField sx={{ width: '100%', "& .MuiOutlinedInput-root":{
          "& fieldset": {
            borderColor: "#202020",
          },
          "&:hover fieldset": {
            borderColor: "#202020",
          },
          "&.Mui-focused fieldset": {
            borderColor: "#303030",
          },
        } }} variant="outlined"  placeholder="Title" value={title} onChange={(e)=>setTitle(e.target.value)}/>
        <TextField sx={{ width: '100%', "& .MuiOutlinedInput-root":{
          "& fieldset": {
            borderColor: "#202020",
          },
          "&:hover fieldset": {
            borderColor: "#202020",
          },
          "&.Mui-focused fieldset": {
            borderColor: "#303030",
          },
        } }} multiline rows={33} variant="outlined"  placeholder="Page" value={content} onChange={(e)=>setContent(e.target.value)}/>
      </Box>
			<Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, display:'flex', zIndex: 1000,backgroundColor: '#202020', padding: 2, alignItems: 'center', justifyContent: 'space-between'}}>
        <Link href='/' >
        <Button size='small' variant='contained' sx={{ backgroundColor: '#262626', borderRadius: '7px', fontSize: '12px' }} onClick={handleDelete} disableRipple >Delete</Button>
          </Link>
        <Link href='/' >
				  <Button size='small' variant='contained' sx={{ backgroundColor: '#262626', borderRadius: '7px', fontSize: '12px' }} disableRipple onClick={handleSave} >Save</Button>
        </Link>
			</Box>
    </Box>
	);
}

export default Edit;