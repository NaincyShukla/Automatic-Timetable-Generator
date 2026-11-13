function TeacherTable({ teachers = [] }) {

    return (

        <table className="teacher-table">

            <thead>

                <tr>

                    <th>Employee ID</th>
                    <th>Teacher Name</th>
                    <th>Subjects</th>

                </tr>

            </thead>

            <tbody>

                {teachers.length === 0 ? (

                    <tr>

                        <td
                            colSpan="3"
                            style={{
                                textAlign: "center",
                                padding: "25px",
                            }}
                        >
                            No Teachers Found
                        </td>

                    </tr>

                ) : (

                    teachers.map((teacher) => (

                        <tr key={teacher._id}>

                            <td>{teacher.employeeId}</td>

                            <td>{teacher.name}</td>

                            <td>
                                {teacher.subjects.length > 0
                                    ? teacher.subjects.join(", ")
                                    : "-"}
                            </td>

                        </tr>

                    ))

                )}

            </tbody>

        </table>

    );

}

export default TeacherTable;