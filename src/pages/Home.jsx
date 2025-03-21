import React, { useState, useEffect } from 'react';
import { Box, Typography, Divider, Link } from '@mui/material';
import { invoke } from '@tauri-apps/api/core';
import TextList from "/src/components/TextList"
import AddCircleIcon from '@mui/icons-material/AddCircle';

function Home() {
	const [texts, setTexts] = useState([]);
	const [wordCounts, setWordCounts] = useState({});

	// fetches the texts from database
	useEffect(()=> {
		const fetchData= async()=> {
			try{
				const result= await invoke('get_texts');
				console.log("Fetched texts:", result);
				setTexts(result);
	
				const countsMap= {};
				for(const text of result) {
					console.log(`Fetching word counts for text ID ${text.id}`);
					const countsArray= await invoke('get_text_word_counts', { textId: text.id });
					console.log(`Fetched word counts for text ID ${text.id}:`, countsArray);
	
					if(countsArray && Array.isArray(countsArray)){
						const [newCount, seenCount, knownCount]= countsArray;
						countsMap[text.id]= { newCount, seenCount, knownCount };
					}
					else{
						console.warn(`Invalid word counts for text ID ${text.id}`);
						countsMap[text.id]= { newCount: 0, seenCount: 0, knownCount: 0 };
					}
				}
	
				console.log("Word counts map:", countsMap);
				setWordCounts(countsMap);
			}
			catch(error){
				console.error('Error fetching data:', error);
			}
		};
	
		fetchData();
	}, []);

	return (
		<Box sx={{ display: 'flex', justifyContent: 'center'}} >
		<Box sx={{ padding: {xs:0, sm:2}, margin: 1, width: '800px', backgroundColor: '#202020', marginTop: 2.5, borderRadius: '15px' }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', marginLeft: {xs:3, sm:4}, marginRight: {xs:6, sm:8}, marginTop: {xs:'15px', sm:0} }}>
				<Box>
					<Typography variant='body1' sx={{ fontWeight: 'bold' }} >Text</Typography>
				</Box>
				<Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'flex-end' }}>
					<Typography variant='body1' sx={{ fontWeight: 'bold' }} >New</Typography>
					<Typography variant='body1' sx={{ marginLeft: {xs:'15px', sm:'20px'}, fontWeight: 'bold' }} >Seen</Typography>
					<Typography variant='body1' sx={{ marginLeft: {xs:'15px', sm:'20px'}, fontWeight: 'bold' }} >Know</Typography>
				</Box>
				<Link href='/new' sx={{ fontSize: '0px', margin: 0, padding: 0, alignContent: 'center', }}>
				<AddCircleIcon sx={{ position: 'absolute', marginLeft: {xs:'11px', sm:'27px'}, marginTop: '-10px', fontSize:'20px', color: '#aaaaaa'}} />
				</Link>
			</Box>
			<Divider sx={{ borderColor: '#131313' }} variant='middle' />
			<Box sx={{ marginTop: {xs:1, sm:3} }}>
      			{texts.map((text) => {
					  const counts= wordCounts[text.id] || { newCount: 0, seenCount: 0, knownCount: 0 };
					  console.log(`Rendering TextList for text ID ${text.id}: ${counts.newCount}, ${counts.seenCount}, ${counts.knownCount} }`);
					return(
						<TextList
						key={text.id}
						id={text.id}
						link={`/read/${text.id}`}
						title={text.title}
						newCount= {counts.newCount}
						seenCount= {counts.seenCount}
						knownCount= {counts.knownCount}
						/>
					);
				})}
			</Box>
		</Box>
		</Box>
	);
}
export default Home;