import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Box, Typography, TextField, IconButton, Tooltip, Link, useMediaQuery, useTheme } from "@mui/material";
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import CloseIcon from '@mui/icons-material/Close';

function TextBox({ title, textblock, words, selectedWord, setSelectedWord, updateWords }) {
  const [newMeaning, setNewMeaning]= useState("");
  const [dictionaryLink, setDictionaryLink]= useState("");
  const [dictionaryLink2, setDictionaryLink2]= useState("");
  const [dictionaryLink3, setDictionaryLink3]= useState("");
  const [dictionaryLink4, setDictionaryLink4]= useState("");
  const theme= useTheme();
  const isMobile= useMediaQuery(theme.breakpoints.down('sm'));

  const renderTextWithClickableWords= ()=> {
    const cleanedText= textblock.replace(/-/g, "").trim();
    const segments= cleanedText.split(/([^\p{L}\d]+)/u);

    console.log("Segments after splitting:", segments);

    return segments.map((segment, index)=> {
        if(!segment.trim()){
            return <span key={index}>{segment}</span>;
        }
        const cleanedSegment= segment.replace(/[.,:\/"“'\[\](){}<>]/g, "").trim();

        console.log(`Segment ${index}:`, segment);
        console.log(`Cleaned Segment ${index}:`, cleanedSegment);

        if(words && words.some((w)=> w.word=== cleanedSegment)){
            const wordData= words.find((w)=> w.word=== cleanedSegment);
            const status= wordData.status;

            console.log(`Match found for cleaned segment:`, cleanedSegment);

            return (
                <span
                    key={index}
                    onClick={()=> setSelectedWord(wordData.word)}
                    style={{
                        color: status=== "known" ? "#dddddd" : status=== "seen" ? "#dddddd": "#909FAF",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        margin: "0 2px",
                    }}> {segment} </span>
            );
        }
        else{
            return <span key={index}>{segment}</span>;
        }
    });
};

const closeSidePanel= ()=>{
  setSelectedWord("");
};

const countryCodeToDictionaryLink = {
  dk: "https://m.dict.cc/danish-english/",
  nl: "https://m.dict.cc/dutch-english/",
  fr: "https://m.dict.cc/french-english/",
  de: "https://m.dict.cc/deutsch-englisch/",
  it: "https://m.dict.cc/italian-english/",
  no: "https://m.dict.cc/norwegian-english/",
  pl: "https://m.dict.cc/polish-english/",
  pt: "https://m.dict.cc/portuguese-english/",
  ru: "https://m.dict.cc/russian-english/",
  es: "https://m.dict.cc/spanish-english/",
  se: "https://m.dict.cc/swedish-english/",
  tr: "https://m.dict.cc/turkish-english/",
};

const countryCodeToDictionaryLink2 = {
  dk: "https://www.deepl.com/en/translator#da/en/",
  nl: "https://www.deepl.com/en/translator#nl/en/",
  fr: "https://www.deepl.com/en/translator#fr/en/",
  de: "https://www.deepl.com/en/translator#de/en/",
  it: "https://www.deepl.com/en/translator#it/en/",
  no: "https://www.deepl.com/en/translator#nb/en/",
  pl: "https://www.deepl.com/en/translator#pl/en/",
  pt: "https://www.deepl.com/en/translator#pt/en/",
  ru: "https://www.deepl.com/en/translator#ru/en/",
  es: "https://www.deepl.com/en/translator#es/en/",
  se: "https://www.deepl.com/en/translator#sv/en/",
  tr: "https://www.deepl.com/en/translator#tr/en/",
};

const countryCodeToDictionaryLink3 = {
  dk: "https://dk.thefreedictionary.com/",  //* doesnt exist
  nl: "https://nl.thefreedictionary.com/",
  fr: "https://fr.thefreedictionary.com/",
  de: "https://de.thefreedictionary.com/",
  it: "https://it.thefreedictionary.com/",
  no: "https://no.thefreedictionary.com/",
  pl: "https://pl.thefreedictionary.com/",
  pt: "https://pt.thefreedictionary.com/",
  ru: "https://ru.thefreedictionary.com/",
  es: "https://es.thefreedictionary.com/",
  se: "https://se.thefreedictionary.com/",  //* doesnt exist
  tr: "https://tr.thefreedictionary.com/",
};

const countryCodeToDictionaryLink4 = {
  dk: "https://translate.google.com/?sl=da&tl=en&text=",
  nl: "https://translate.google.com/?sl=nl&tl=en&text=",
  fr: "https://translate.google.com/?sl=fr&tl=en&text=",
  de: "https://translate.google.com/?sl=de&tl=en&text=",
  it: "https://translate.google.com/?sl=it&tl=en&text=",
  no: "https://translate.google.com/?sl=no&tl=en&text=",
  pl: "https://translate.google.com/?sl=pl&tl=en&text=",
  pt: "https://translate.google.com/?sl=pt&tl=en&text=",
  ru: "https://translate.google.com/?sl=ru&tl=en&text=",
  es: "https://translate.google.com/?sl=es&tl=en&text=",
  se: "https://translate.google.com/?sl=sv&tl=en&text=",
  tr: "https://translate.google.com/?sl=tr&tl=en&text=",
};

useEffect(()=> {
  const fetchCountryCode= async()=> {
    try{
      const savedCountryCode= await invoke("get_selected_country_code");
      if(savedCountryCode){
        const link= countryCodeToDictionaryLink[savedCountryCode] || "https://m.dict.cc/turkish-english/";
        const link2= countryCodeToDictionaryLink2[savedCountryCode] || "https://www.deepl.com/en/translator#tr/en/";
        const link3= countryCodeToDictionaryLink3[savedCountryCode] || "https://www.thefreedictionary.com/";
        const link4= countryCodeToDictionaryLink4[savedCountryCode] || "https://translate.google.com/?sl=auto&tl=en&text=";
        setDictionaryLink(link);
        setDictionaryLink2(link2);
        setDictionaryLink3(link3);
        setDictionaryLink4(link4);
      }
      else{
        setDictionaryLink("https://m.dict.cc/turkish-english/");
        setDictionaryLink2("https://www.deepl.com/en/translator#tr/en/");
        setDictionaryLink3("https://www.deepl.com/en/translator#tr/en/");
        setDictionaryLink4("https://translate.google.com/?sl=auto&tl=en&text=");
      }
    }
    catch(error){
      console.error("Error fetching country code:", error);
      setDictionaryLink("https://m.dict.cc/turkish-english/");
      setDictionaryLink2("https://www.deepl.com/en/translator#tr/en/");
      setDictionaryLink3("https://www.thefreedictionary.com/");
      setDictionaryLink4("https://translate.google.com/?sl=auto&tl=en&text=");
    }
    finally{
      setIsLoading(false);
    }
  };

  fetchCountryCode();
}, []);

const selectedWordData= words.find((w)=> w.word=== selectedWord);

console.log("Selected word:", selectedWord);
console.log("Words array:", words);
console.log("Selected word data:", selectedWordData);

const handleSaveMeaning= async ()=> {
  if(!selectedWord || !newMeaning.trim()) {
      return;
  }
  try{
      const strippedWord = selectedWord.replace(/[^\p{L}\p{M}\s]/gu, "");
      console.log("Stripped word:", strippedWord);

      const wordId= words.find((w)=> w.word=== strippedWord)?.id;
      if(!wordId){
          return;
      }

      const params= { wordId: wordId, meaning: newMeaning };
      console.log("Saving meaning with parameters:", params);

      await invoke("update_word_meaning", params);
      await updateWords();

      setNewMeaning("");
  }
  catch(error){
      console.error("Error saving meaning:", error);
      alert("Failed to save meaning.");
  }
};

const handleMarkAsKnown= async()=> {
  if(!selectedWord){
      return;
  }
  try{
      handleSaveMeaning();

      const strippedWord= selectedWord.replace(/[^\p{L}\p{M}\s]/gu, "");
      console.log("Stripped word:", strippedWord);

      const wordId= words.find((w)=> w.word=== strippedWord)?.id;
      if(!wordId){
          return;
      }
      console.log("Marking word ID as known:", wordId);
      await invoke("mark_word_as_known", { wordId });

      await updateWords();

  }
  catch(error){
      console.error("Error marking word as known:", error);
  }
};

  return(
    <Box sx={{ display: 'flex', padding: isMobile ? 1.5 : '1.5%' }}>
      <Box sx={{ maxWidth: isMobile? '100%' : 'calc(100% - 400px)' }} >
        <Typography variant="h4" sx={{ textAlign: 'center' }}> {title} </Typography>
        <Typography variant="h6" sx={{ lineHeight: 2.5, color: '#dddddd', whiteSpace: 'pre-wrap', }}> {renderTextWithClickableWords()} </Typography>
      </Box>
      {isMobile ? (selectedWord && (
        <Box sx={{
          flexGrow: 1,
          marginLeft: '30px',
          backgroundColor: '#202020',
          borderRadius: '25px',
          padding: 2,
          height: '775px',
          position: 'fixed',
          right: 0,
          marginRight: '15px',
        }}>
        <Box sx={{ backgroundColor: '#202020', padding: 1 , maxWidth: '350px', display: 'flex' }}>
          <Typography sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '350px' }} variant="h5"> {selectedWord || "Select a word"} </Typography>
          <IconButton sx={{ color: '#dddddd', marginLeft: 1, height: '20px' }} onClick={closeSidePanel} >
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ backgroundColor: '#262626', borderRadius: '5px', padding: 1, marginTop: 1.5}}>
          <TextField sx={{
            width: '70%',
          }} variant="standard"  placeholder="Save Meaning" value={newMeaning} onChange={(e)=> setNewMeaning(e.target.value)} />
          <Tooltip title="Add to seen words" >
          <IconButton sx={{ color: '#dddddd', marginLeft: 1 }} onClick={handleSaveMeaning} >
            <PlaylistAddIcon/>
          </IconButton>
          </Tooltip>
          <Tooltip title="Mark as known word" >
          <IconButton sx={{ color: '#dddddd', marginLeft: 1 }} onClick={handleMarkAsKnown} >
            <PlaylistAddCheckIcon />
          </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ backgroundColor: '#262626', borderRadius: '5px', padding: 1, marginTop: 1.5}}>
          <Typography variant="caption" sx={{ color: '#aaaaaa' }} > Saved Meaning </Typography>
          <Typography sx={{ height: '20px'  }}> {selectedWordData?.meaning || ""} </Typography>
        </Box>
        <Box sx={{ marginTop: 1.5 }}>
          <iframe width="350px" style={{ height: '500px' }} src={`${dictionaryLink}${selectedWord || ""}.html`} frameborder="0" ></iframe>
          {/* <iframe width="350px" style={{ height: '325px', marginTop: '15px' }} src={`${dictionaryLink2}`} frameborder="0" ></iframe> */}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-around' }} >
          <Link href={`${dictionaryLink2}${selectedWord}`} target='_blank' sx={{ color: '#dddddd' }} >
              <Typography variant="body1" sx={{ marginLeft: '2px' }} >DeepL</Typography>
              <Typography variant="body2" sx={{ color: '#999', fontSize: '12px' }} >deepl.com</Typography>
            </Link>
          <Link href={`${dictionaryLink4}${selectedWord}&op=translate`} target='_blank' sx={{ color: '#dddddd' }} >
              <Typography variant="body1" sx={{ marginLeft: '10px' }} >Translate</Typography>
              <Typography variant="body2" sx={{ color: '#999', fontSize: '12px' }} >translate.google.com</Typography>
            </Link>
            <Link href={`${dictionaryLink3}${selectedWord}`} target='_blank' sx={{ color: '#dddddd' }} >
              <Typography variant="body1" sx={{ marginLeft: '10px' }} >Dictionary</Typography>
              <Typography variant="body2" sx={{ color: '#999', fontSize: '12px' }} >thefreedictionary.com</Typography>
            </Link>
          </Box>
        </Box>
      </Box>
    )):
      <Box sx={{
        flexGrow: 1,
        marginLeft: '30px',
        backgroundColor: '#202020',
        borderRadius: '25px',
        padding: 2,
        height: '915px',
        position: 'fixed',
        right: 0,
        marginRight: 2,
      }}>
        <Box sx={{ backgroundColor: '#202020', padding: 1 , maxWidth: '350px' }}>
          <Typography sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '350px' }} variant="h5"> {selectedWord || "Select a word"} </Typography>
        </Box>
        <Box sx={{ backgroundColor: '#262626', borderRadius: '5px', padding: 1, marginTop: 1.5}}>
          <TextField sx={{
            width: '70%',
          }} variant="standard"  placeholder="Save Meaning" value={newMeaning} onChange={(e)=> setNewMeaning(e.target.value)} />
          <Tooltip title="Add to seen words" >
          <IconButton sx={{ color: '#dddddd', marginLeft: 1 }} onClick={handleSaveMeaning} >
            <PlaylistAddIcon/>
          </IconButton>
          </Tooltip>
          <Tooltip title="Mark as known word" >
          <IconButton sx={{ color: '#dddddd', marginLeft: 1 }} onClick={handleMarkAsKnown} >
            <PlaylistAddCheckIcon />
          </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ backgroundColor: '#262626', borderRadius: '5px', padding: 1, marginTop: 1.5}}>
          <Typography variant="caption" sx={{ color: '#aaaaaa' }} > Saved Meaning </Typography>
          <Typography sx={{ height: '20px'  }}> {selectedWordData?.meaning || ""} </Typography>
        </Box>
        <Box sx={{ marginTop: 1.5 }}>
          <iframe width="350px" style={{ height: '635px' }} src={`${dictionaryLink}${selectedWord || ""}.html`} frameborder="0" ></iframe>
          {/* <iframe width="350px" style={{ height: '325px', marginTop: '15px' }} src={`${dictionaryLink2}`} frameborder="0" ></iframe> */}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-around' }} >
          <Link href={`${dictionaryLink2}${selectedWord}`} target='_blank' sx={{ color: '#dddddd' }} >
              <Typography variant="body1" sx={{ marginLeft: '2px' }} >DeepL</Typography>
              <Typography variant="body2" sx={{ color: '#999', fontSize: '12px' }} >deepl.com</Typography>
            </Link>
          <Link href={`${dictionaryLink4}${selectedWord}&op=translate`} target='_blank' sx={{ color: '#dddddd' }} >
              <Typography variant="body1" sx={{ marginLeft: '10px' }} >Translate</Typography>
              <Typography variant="body2" sx={{ color: '#999', fontSize: '12px' }} >translate.google.com</Typography>
            </Link>
            <Link href={`${dictionaryLink3}${selectedWord}`} target='_blank' sx={{ color: '#dddddd' }} >
              <Typography variant="body1" sx={{ marginLeft: '10px' }} >Dictionary</Typography>
              <Typography variant="body2" sx={{ color: '#999', fontSize: '12px' }} >thefreedictionary.com</Typography>
            </Link>
          </Box>
          
          {/* <iframe width="350px" style={{ height: '330px', marginTop: '15px' }} src="https://en.openrussian.org/ru/%D0%9C%D0%B5%D0%BD%D1%8F" frameborder="0" ></iframe> */}
          
          {/* <iframe width="350px" style={{ height: '670px' }} src={`https://m.dict.cc/deutsch-englisch/${selectedWord || ""}.html`} frameborder="0" ></iframe> */}
          {/* <iframe width="350px" style={{ height: '670px' }} src={`https://tureng.com/en/german-english/${selectedWord || ""}`} frameborder="0" ></iframe> */}
          {/* <iframe width="350px" style={{ height: '670px' }} src="https://bing.com/translate" frameborder="0" ></iframe> */}
          {/* <iframe width="350px" style={{ height: '670px' }} src="https://webtranslation.paralink.com/" frameborder="0" ></iframe> */}
          {/* <iframe width="350px" style={{ height: '670px' }} src="https://dictionary.reverso.net/english-definition/test" frameborder="0" ></iframe> */}
          {/* <iframe width="350px" style={{ height: '670px' }} src="https://translate.yandex.com/en/?source_lang=en&target_lang=ru&text=test" frameborder="0" ></iframe> */}
        </Box>
      </Box>
      }
    </Box>
  );
}

export default TextBox;