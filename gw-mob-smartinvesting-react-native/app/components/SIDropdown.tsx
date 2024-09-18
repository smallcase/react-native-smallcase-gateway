import React, {useState} from 'react';
import {Dropdown} from 'react-native-element-dropdown';
import {DropdownProps} from 'react-native-element-dropdown/lib/typescript/components/Dropdown/model';
type SIDropDownProps<T> = {
  labelField: keyof T;
  valueField: keyof T;
  defaultValue: T;
  data: T[];
  onChange: (item: T) => void;
  base?: DropdownProps<T>;
};

const SIDropDown = <T,>({
  labelField,
  valueField,
  defaultValue,
  data,
  onChange,
  base,
}: SIDropDownProps<T>) => {
  const [current, setCurrent] = useState(defaultValue);
  return (
    <Dropdown
      {...base}
      labelField={labelField}
      valueField={valueField}
      value={current}
      data={data}
      onChange={item => {
        setCurrent(item);
        onChange(item);
      }}
    />
  );
};

export {SIDropDown};
