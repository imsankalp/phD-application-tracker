module.exports = {
    formatDate: (date) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Intl.DateTimeFormat('en-US', options).format(date);
    },
    compareDates: (date1, date2) => {
        return new Date(date1) - new Date(date2);
    },
    isPastDate: (date) => {
        return new Date(date) < new Date();
    },
    isFutureDate: (date) => {
        return new Date(date) > new Date();
    }
};