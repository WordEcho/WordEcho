import React, { useState, useEffect } from "react";
import { Select, MenuItem, FormControl, InputLabel, Box } from "@mui/material";
import { invoke } from "@tauri-apps/api/core";

const ImageDropdown= ()=> {
  const [selectedImage, setSelectedImage]= useState("https://hatscripts.github.io/circle-flags/flags/tr.svg");

  const imageOptions= [
    { id: 0, url: "https://hatscripts.github.io/circle-flags/flags/dk.svg" },
    { id: 1, url: "https://hatscripts.github.io/circle-flags/flags/nl.svg" },
    { id: 2, url: "https://hatscripts.github.io/circle-flags/flags/fr.svg" },
    { id: 3, url: "https://cdn-icons-png.flaticon.com/128/16022/16022134.png" },
    { id: 4, url: "https://hatscripts.github.io/circle-flags/flags/it.svg" },
    { id: 5, url: "https://hatscripts.github.io/circle-flags/flags/no.svg" },
    { id: 6, url: "https://hatscripts.github.io/circle-flags/flags/pl.svg" },
    { id: 7, url: "https://hatscripts.github.io/circle-flags/flags/pt.svg" },
    { id: 8, url: "https://hatscripts.github.io/circle-flags/flags/ru.svg" },
    { id: 9, url: "https://hatscripts.github.io/circle-flags/flags/es.svg" },
    { id: 10, url: "https://hatscripts.github.io/circle-flags/flags/se.svg" },
    { id: 11, url: "https://hatscripts.github.io/circle-flags/flags/tr.svg" },
  ];

  const idToCountryCode= {
    0: "dk",
    1: "nl",
    2: "fr",
    3: "de",
    4: "it",
    5: "no",
    6: "pl",
    7: "pt",
    8: "ru",
    9: "es",
    10: "se",
    11: "tr",
  };

  const countryCodeToId= Object.fromEntries(
    Object.entries(idToCountryCode).map(([id, code])=> [code, parseInt(id)])
  );

  useEffect(()=> {
    const fetchSavedCountryCode= async ()=> {
      try{
        const savedCountryCode= await invoke("get_selected_country_code");
        if(savedCountryCode){
          const savedId= countryCodeToId[savedCountryCode];
          if(savedId!== undefined){
            const savedImage= imageOptions.find((option)=> option.id=== savedId)?.url;
            if(savedImage){
              setSelectedImage(savedImage);
            }
          }
        }
      }
      catch(error){
        console.error("Error fetching saved country code:", error);
      }
    };

    fetchSavedCountryCode();
  }, []);

  const handleChange= async (event)=> {
    const selectedUrl= event.target.value;
    setSelectedImage(selectedUrl);

    const selectedOption= imageOptions.find((option)=> option.url=== selectedUrl);
    if(selectedOption){
      const selectedId= selectedOption.id;
      const countryCode= idToCountryCode[selectedId];

      try{
        await invoke("save_selected_country_code", { countryCode });
        console.log("Country code saved:", countryCode);
      }
      catch(error){
        console.error("Error saving country code:", error);
      }
    }
  };

  return (
    <Box>
      <FormControl fullWidth>
        <InputLabel id="image-select-label"></InputLabel>
        <Select
          sx={{
            width: "100%", height: "30px",
            "& .MuiOutlinedInput-input": {
              padding: "2px",
              marginTop: "6px",
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "#202020",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#202020",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#202020",
            },
          }}
          MenuProps={{
            PaperProps: {
              sx: { backgroundColor: "#202020", color: "#f5f5f5", marginLeft: '0px', paddingLeft: '2px' },
            },
          }}
          labelId="image-select-label"
          id="image-select"
          value={selectedImage}
          onChange={handleChange}
          renderValue={(selected)=> (
            <img src={selected} alt="Selected" style={{ width: 26, height: 26 }} />
          )}
        >
          {imageOptions.map((option)=> (
            <MenuItem key={option.id} value={option.url}>
              <img src={option.url} alt={`Option ${option.id}`} style={{ width: 26, height: 26 }} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default ImageDropdown;