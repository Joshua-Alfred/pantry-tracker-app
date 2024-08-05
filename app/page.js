"use client"
import { Box, Stack, Typography, Button, ButtonGroup, Modal, TextField } from "@mui/material";
import { firestore } from "@/firebase";
import { collection, getDocs, query, doc, setDoc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

// const items =["tomato", "onion", "potato", "garlic", "ginger", "carrot", "apple", "banana", "lettuce", "cucumber", "olives"]

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  flexDirection: 'column'
};

export default function Home() {
  const [pantry, setPantry] = useState([])
  const [filteredPantry, setFilteredPantry] = useState([]); 
  const [openRecipe, setOpenRecipe] = useState(false);
  const [recipe, setRecipe] = useState(null);
  const handleOpenRecipe = async () => {
    try {
      const pantryList = pantry.map(item => `${item.id}: ${item.quantity}`).join(", ");
      
      
      const prompt = `You are an experienced chef. You will receive inputs from the user in the form of a list of objects,
       each with id: name of the item, and a field quantity: integer value. You must output a recipe recommendation based 
       on the list of items given to you only. Assume there are unlimited supplies of oils and spices. Provide a recipe 
       recommendation with step-by-step instructions in a written paragraph of up to 150 words. Here is the list: ${pantryList}. 
       Can you suggest a recipe using these ingredients?`;
  

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`, 
        },
        body: JSON.stringify({
          model: 'openai/gpt-3.5-turbo',
          messages: [
            { role: 'user', content: prompt }
          ],
          max_tokens: 150,
          temperature: 0.7,
        }),
      });

      const data = await response.json();

      console.log(data)

      if (data && data.choices && data.choices.length > 0) {
        const recipe = data.choices[0].message.content
        setRecipe(recipe)
      } else {
        setRecipe('No recipe found or unexpected response format.');
      }
 
      setOpenRecipe(true);
    } catch (error) {
      console.error("Error fetching recipe:", error);
    }
  };
  

  const handleCloseRecipe = () => {
    setOpenRecipe(false);
    setRecipe(null);
  };
  const [openNew, setOpenNew] = useState(false)
  const handleOpenNew = () => setOpenNew(true)
  const handleCloseNew = () => setOpenNew(false)
  const [itemName, setItemName] = useState("");
  const [itemQuantity, setItemQuantity] = useState("");
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // const handleQuantityChange = (e) => {
  //   const value = e.target.value;
  //   const regex = /^[1-9]\d*$/; // Only allow numbers greater than 0

  //   if (!regex.test(value)) {
  //     setError("Please enter a valid number greater than 0.");
  //   } else {
  //     setError("");
  //   }
  //   setQuantity(value);
  // };

    const updatePantry = async () => {
    const items = query(collection(firestore, 'pantry'))
    const docs = await getDocs(items)
    const pantryList = []
    docs.forEach((doc) => {
      pantryList.push({id: doc.id, quantity: doc.data().quantity})
    })
    setPantry(pantryList)
    setFilteredPantry(pantryList)
  }

useEffect(() => {
  updatePantry()
}, [])

const addItem = async (name, quantity) => {
  try {
    const itemRef = doc(firestore, 'pantry', name)
    await setDoc(itemRef, { quantity: parseInt(quantity, 10) })
    await updatePantry()
  }
  catch(error) {
    console.error(error)
  }
};

const handleIncrement = async (id) => {
  try {
    const itemRef = doc(firestore, 'pantry', id); 
    const itemDoc = await getDoc(itemRef); 
    const newQuantity = itemDoc.data().quantity + 1; 
    await updateDoc(itemRef, { quantity: newQuantity }); 
    await updatePantry(); 
  } catch (error) {
    console.error("Error incrementing item: ", error);
  }
};

const handleDecrement = async (id) => {
  try {
    const itemRef = doc(firestore, 'pantry', id); 
    const itemDoc = await getDoc(itemRef); 
    const newQuantity = itemDoc.data().quantity - 1; 
    if (newQuantity >= 0) {
      await updateDoc(itemRef, { quantity: newQuantity }); 
      await updatePantry(); 
    }
  } catch (error) {
    console.error("Error decrementing item: ", error);
  }
};

const handleDelete = async (id) => {
  try {
    await deleteDoc(doc(firestore, 'pantry', id)); 
    await updatePantry(); 
  } catch (error) {
    console.error("Error deleting item: ", error);
  }
};

const handleSearchChange = (e) => {
  const query = e.target.value.toLowerCase();
  setSearchQuery(query);

  // Filter pantry items based on search query
  const filtered = pantry.filter(item => item.id.toLowerCase().includes(query));
  setFilteredPantry(filtered);
};

  return(
  <Box 
    width="100vw" 
    height="100vh" 
    display={'flex'} 
    justifyContent={'center'} 
    flexDirection={"column"}
    alignItems={'center'}
    border={'3px solid #fff'}>
      
      <Box border={'1px solid #fff'}>
      <Box width="800px" height="50px" bgcolor={"#396d7c"} display="flex" justifyContent="space-around" padding="0 16px" alignItems={'center'}>
        <Typography variant={"h4"} color={"#000"}>
          Inventory
      </Typography>
    </Box>
      <Box width="800px" height="60px" bgcolor={"#dcf3ff"} display="flex" justifyContent="space-between" padding="0 16px" alignItems={'center'}>
      <Button onClick={handleOpenRecipe} variant="contained" width="50px" height="50px">Recipe Maker</Button>
        <Modal
          open={openRecipe}
          onClose={handleCloseRecipe}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box sx={style}>
            <Typography id="modal-modal-title" variant="h5" component="h2" color={"#000"}>
              Recipe Maker
            </Typography>
            {recipe ? (
            <Typography id="modal-modal-description" sx={{ mt: 2 }} color={"#000"}>
              {recipe}
            </Typography>
          ) : (
            <Typography id="modal-modal-description" sx={{ mt: 2 }} color={"#000"}>
              Loading...
            </Typography>
          )}
          </Box>
        </Modal>
        <TextField 
            id="standard-search" 
            label="Search" 
            type="search" 
            size="small" 
            value={searchQuery}
            onChange={handleSearchChange} 
          />
        <Button onClick={handleOpenNew} variant="contained" width="50px" height="50px">Add New Item</Button>
        <Modal
          open={openNew}
          onClose={handleCloseNew}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Stack sx={style} spacing={2}>
            <Typography id="modal-modal-title" variant="h5" component="h2" color={"#000"}>
              Add New Item and Quantity:
            </Typography>
            <TextField
          required
          id="outlined-required"
          label="Item Name"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          />
          <TextField
          id="outlined-number-required"
          label="Item Quantity"
          type="number"
          error={Boolean(error)}
          helperText={error}
          onChange={(e) => setItemQuantity(e.target.value)}
          InputLabelProps={{
            shrink: true, 
          }}
          value={itemQuantity}
          inputProps={{ min: 1}}
          SelectProps={{color: '#ffffff'}}
        />
        <Button onClick={() => {
                addItem(itemName, itemQuantity);
                handleCloseNew();
              }}
         variant="contained" width="50px" height="50px">Add</Button>
          </Stack>
        </Modal>
      </Box>
  
  <Stack
    width="800px" 
    height="500px" spacing={2} overflow={'auto'} border={'1px solid #fff'}>

    {filteredPantry.map((i) => (
      <Box
      key={i}
      width="100%"
      minHeight="100px"
      display={'flex'}
      justifyContent={'space-between'}
      padding="30px"
      alignItems={'center'}
      bgcolor={'#a2d2df'}
      >
        <Box
        display={'flex'}
        justifyContent={'flex-start'}
        alignItems={'center'}>
        <Typography variant={"h6"} color={"#000"} textAlign={'center'}>
        {
        i.id.charAt(0).toUpperCase() + i.id.slice(1)
        }
    
        </Typography>
        </Box>
        <Box
        display={'flex'}
        alignItems={'center'}
        justifyContent={'center'}>
        <Typography variant={"h6"} color={"#000"} textAlign={'center'} style={{ marginRight: '50px' }}>
        {
        i.quantity
        }
        </Typography>
        
       <ButtonGroup aria-label="Medium-sized button group" justifyContent={'flex-end'}>
       <Button onClick={() => handleIncrement(i.id)}>+</Button>
        <Button onClick={() => handleDecrement(i.id)}>-</Button>
        <Button onClick={() => handleDelete(i.id)}>Delete</Button>
        </ButtonGroup>
      </Box>
      </Box>
    ))}
    </Stack>
  </Box>
  </Box>
  );
}
