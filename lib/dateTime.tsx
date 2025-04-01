// Function to format date as MM/DD/YYYY HH:MM AM/PM
export const formatDate = (dateString: string) => {
    const dateObj = new Date(dateString);
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    const year = dateObj.getFullYear();
    const hours = dateObj.getHours() % 12 || 12; // Convert to 12-hour format
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");
    const ampm = dateObj.getHours() >= 12 ? "PM" : "AM";
  
    return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
  };
  