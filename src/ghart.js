import * as React from 'react'
import { useEffect } from 'react';

function Ghart(props) {


  useEffect(() => {
    console.log("data changed")
    console.log(props.data)
  },[props.data]);

  return (
    <div>error</div>
  )
}

export default Ghart;