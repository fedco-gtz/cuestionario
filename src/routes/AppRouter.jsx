import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminQuestions from "../AdminQuestions";
import AdminReviews from "../pages/AdminReviews";

function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<AdminQuestions />} />
                <Route path="/reviews" element={<AdminReviews />} />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRouter;