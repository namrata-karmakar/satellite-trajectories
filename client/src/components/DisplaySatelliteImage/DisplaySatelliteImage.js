import React, { useState } from "react";
import DatePicker from "react-datepicker";
import axios from "axios";
import "react-datepicker/dist/react-datepicker.css";
import "./DisplaySatelliteImage.css";

const DisplaySatelliteImage = () => {
  const [startDate, setStartDate] = useState(new Date("2021-11-01T00:00:00Z"));
  const [endDate, setEndDate] = useState(new Date("2021-11-10T23:59:00Z"));
  const [showImageContainer, setShowImageContainer] = useState();
  const [images, setImages] = useState([]);

  const handleStartDateChange = (date) => {
    setStartDate(date);
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
  };

  const convertToUTC = (date) => {
    const utcDate = new Date(date);
    return utcDate.toISOString();
  };

  const handleSubmit = async () => {
    const queryParams = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    console.log("queryParams...", queryParams);

    const response = await axios
      .get(`http://localhost:3000/api/query?${queryParams}`)
      .then((reponse) => {
        console.log("response.data...", reponse.data);
        console.log("Response from api...", reponse);
        setImages(reponse.data);
        let tempRes = reponse.data;
        if (tempRes !== []) {
          setShowImageContainer(true);
        }
      });
  };

  return (
    <div className="mainContainer">
      <div className="dropdownContainer">
        <div className="startDateDropdownContainer">
          <label>Start Date:</label>
          <DatePicker selected={startDate} onChange={handleStartDateChange} />
        </div>
        <div className="endDateDropdownContainer">
          <label>End Date:</label>
          <DatePicker
            selected={endDate}
            onChange={handleEndDateChange}
            minDate={startDate}
          />
        </div>
        <button className="btn" onClick={handleSubmit}>
          Submit
        </button>
      </div>
      {showImageContainer && (
        <div className="imagesContainer">
          {images.map((image, index) => (
            <div className="imgStyle">
              <img
                key="{image.id}"
                alt="satellite"
                src={images[index].url}
              ></img>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default DisplaySatelliteImage;
