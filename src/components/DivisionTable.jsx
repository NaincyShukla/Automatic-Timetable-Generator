function DivisionTable({ divisions = [] }) {

    return (

        <table className="division-table">

            <thead>

                <tr>

                    <th>Division</th>
                    <th>Semester</th>
                    

                </tr>

            </thead>

            <tbody>

                {divisions.length === 0 ? (

                    <tr>

                        <td
                            colSpan="4"
                            style={{
                                textAlign: "center",
                                padding: "30px",
                            }}
                        >
                            No Divisions Found
                        </td>

                    </tr>

                ) : (

                    divisions.map((division) => (

                        <tr key={division._id}>

                            <td>{division.divisionName}</td>
                            <td>{division.semester}</td>
                            <td>{division.batch}</td>
                            <td>{division.studentCount}</td>

                        </tr>

                    ))

                )}

            </tbody>

        </table>

    );

}

export default DivisionTable;