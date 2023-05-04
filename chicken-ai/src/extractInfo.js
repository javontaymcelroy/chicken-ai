const extractInfo = (chatGPTResponse) => {
    const info = {
      action: null,
      item: null,
      itemId: null,
    };
  
    // Example: parse the response to extract the action, item, and itemId
    // This is just an example and may not cover all cases. You may need to customize this function to better suit your needs.
    if (chatGPTResponse.includes("Added")) {
      info.action = "add";
      // Extract the item details here
    } else if (chatGPTResponse.includes("Updated")) {
      info.action = "update";
      // Extract the item details here
    } else if (chatGPTResponse.includes("Deleted")) {
      info.action = "delete";
      // Extract the itemId here
    }
  
    return info;
  };
  