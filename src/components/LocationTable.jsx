function LocationTable({ locations = [] }) {
  return (
    <table className="location-table">

      <thead>
        <tr>
          <th>Room No</th>
          <th>Type</th>
         
          
         
        </tr>
      </thead>

      <tbody>

        {locations.length === 0 ? (

          <tr>

            <td
              colSpan="5"
              style={{ textAlign: "center", padding: "30px" }}
            >
              No Locations Found
            </td>

          </tr>

        ) : (

          locations.map((location) => (

            <tr key={location._id}>

              <td>{location.roomNo}</td>

              <td>{location.type}</td>

              

             

             

            </tr>

          ))

        )}

      </tbody>

    </table>
  );
}

export default LocationTable;