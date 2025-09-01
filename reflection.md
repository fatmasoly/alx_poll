# Reflection

**Symbols used:**  
- @PollForm  
- @handleSubmit  
- @PollResultChart  
- @fetchResults  
- @PollDetailPage  

**AI produced:**  
- Added `react-hook-form` integration in `PollForm` with validation and inline error messages.  
- Updated `handleSubmit` to redirect to the results page after successful submission.  
- Replaced the static chart in `PollResultChart` with a `Recharts PieChart` including tooltips, legend, and percentage labels.  
- Refactored `fetchResults` to use SWR with loading and error states.  
- In `PollDetailPage`, replaced `@mockPoll` with an API call to `/api/polls/{id}` using params.  

**What worked well:**  
- The AI scaffolding saved a lot of boilerplate time for Recharts and react-hook-form setup.  
- SWR integration was generated cleanly with loading and error states already considered.  

**What didn’t work well:**  
- Validation messages in `PollForm` were too generic and required manual fine-tuning.  
- The AI-generated SWR code needed slight adjustments to match the project’s fetcher utility.  
