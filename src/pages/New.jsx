import React, { useState} from 'react';
import { TextField, Box, Button, Link, Tooltip } from '@mui/material';
import { invoke } from '@tauri-apps/api/core';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

function New() {
  const [title, setTitle]= useState('');
  const [content, setContent]= useState('');

  // saves text to database
  const handleSave= async()=> {
    try{
      const newText= await invoke('create_text', { title, content });
      console.log('New text added:', newText);
      setTitle('');
      setContent('');
    }
    catch (error){
      console.error('Error saving text:', error);
    }
  };

  // exports a key to sync databases
  const handleExport= async()=> {
    try{
      const syncKey= await invoke('generate_sync_key');
      console.log('Sync Key:', syncKey);

      await navigator.clipboard.writeText(syncKey); // copy key to clipboard
      alert('Sync key copied to clipboard!');
    }
    catch(error){
      console.error('Error generating sync key:', error);
      alert('Failed to generate sync key.');
    }
  };

  // imports the key from the title box
  const handleImport= async()=> {
    try{
      const syncKey= title;
      if(!syncKey){
        alert('No sync key provided.');
        return;
      }

      await invoke('apply_sync_key', { syncKey });
      alert('Database imported successfully!');
    }
    catch(error){
      console.error('Error applying sync key:', error);
      alert('Failed to import database.');
    }
  };

	return (
    <Box sx={{ padding: 1, display: 'flex', justifyContent: 'center'}} >
      <Box sx={{ display: 'flex', flexDirection: 'column', backgroundColor: '#202020', borderRadius: '5px', padding: 1, marginTop: 1.5, justifyContent: 'center', width: '800px' }}>
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
				<Link href='/'>
        <Button size='small' variant='contained' sx={{ backgroundColor: '#262626', borderRadius: '7px', fontSize: '12px' }} disableRipple >Exit</Button>
        </Link>
        <Box>
          <Tooltip title='Generate a key to share your database'>
				    <Button size='small' variant='contained' sx={{ backgroundColor: '#262626', borderRadius: '7px', fontSize: '12px', marginLeft: 1 }} disableRipple startIcon={ <FileUploadIcon/> } onClick={handleExport} >Export</Button>
          </Tooltip>
          <Tooltip title='Use title as a key to import a database'>
				    <Button size='small' variant='contained' sx={{ backgroundColor: '#262626', borderRadius: '7px', fontSize: '12px', marginLeft: 1 }} disableRipple startIcon={ <FileDownloadIcon/> } onClick={handleImport} >Import</Button>
          </Tooltip>
        </Box>
				<Button size='small' variant='contained' sx={{ backgroundColor: '#262626', borderRadius: '7px', fontSize: '12px' }} disableRipple onClick={handleSave} >Save</Button>
			</Box>
    </Box>

	);
}

export default New;