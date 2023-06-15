import React, { useEffect } from "react";
import { Dropdown } from "semantic-ui-react";

const SelectDropdown = (props) => {
    const onValueChange = (e, { value }) => props.sendVal(value);

    return (
        <Dropdown
            placeholder="Select Satellite"
            fluid
            search
            selection
            options={props.values}
            onChange={onValueChange}
        />
    );
}

export default SelectDropdown
