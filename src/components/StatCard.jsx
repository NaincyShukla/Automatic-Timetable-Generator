import "../styles/statcard.css";

function StatCard({ icon, value, title, subtitle }) {

    return (

        <div className="stat-card">

            <div className="stat-icon">

                {icon}

            </div>

            <div className="stat-info">

                <h2>{value}</h2>

                <h3>{title}</h3>

                <p>{subtitle}</p>

            </div>

        </div>

    );

}

export default StatCard;