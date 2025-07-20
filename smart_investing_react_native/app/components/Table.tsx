import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

interface TableSectionProps {
  title: string;
  rows: Array<TableRowProps>;
}

interface TableRowProps {
  name: string;
  value: string;
}

const TableRow = (props: TableRowProps) => {
  return (
    <View style={styles.row}>
      <Text>{props.name}</Text>
      <Text>{props.value}</Text>
    </View>
  );
};

const TableSection = (props: TableSectionProps) => {
  return (
    <View style={styles.section}>
      <Text>{props.title}</Text>
      {props.rows.map(row => {
        return TableRow(row);
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flex: 1,
    marginHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  section: {
    borderColor: 'black',
    borderWidth: 1,
  },
});

export {TableRow, TableSection};
