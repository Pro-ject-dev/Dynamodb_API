const AWS = require('aws-sdk');
const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());
app.use(express.json());
const apiport = 8080;

// DATABASE CONFIGURATION

AWS.config.update({
  region: 'af-south-1',
  endpoint: 'http://localhost:8000',
});

const docClient = new AWS.DynamoDB.DocumentClient();

// CREATE

app.post('/add', (req, res) => {
  console.log('Received POST request to add student:', req.body);
  const student = {
    SPR_NO: req.body.id,
    name: req.body.name,
    age: req.body.age,
    email: req.body.email,
  };

  const params = {
    TableName: 'Student-info',
    Item: student,
  };

  docClient.put(params, (err, data) => {
    if (err) {
      console.error('Error adding student:', err);
      res.status(500).json({ error: 'Could not add student' });
    } else {
      console.log('Student added successfully:', data);
      res.status(200).json({ message: 'Student added successfully' });
    }
  });
});


// READ

app.get('/get',(req,res)=>{        //------> retrieve all student's data
  const params={
    TableName:"Student-info",
  }
  docClient.scan(params,(err,data)=>{
    if(data){
      console.log(data.Items);
      res.send(data.Items);
    }
    else{
      console.log(err);
    }
  })
});



app.post('/get_spec', (req, res) => {   //------> retrieve specific student data          
  const params = {
    TableName: 'Student-info',
    Key: {
      SPR_NO: req.body.id
    }
  };
  
  docClient.get(params, (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).send("Error retrieving data");
    } else {
      if (data.Item) {
        res.send(data.Item);
      } else {
        res.status(404).send("Item not found");
      }
    }
  });
});


// UPDATE

app.put('/update/:id', (req, res) => {
  const studentId = req.params.id;
  const { name, age, email } = req.body;

  console.log('Received PUT request to update student:', studentId, req.body);

  const params = {
    TableName: 'Student-info', // Replace with your table name
    Key: {
      SPR_NO: studentId, // Use the student ID from URL parameters
    },
    UpdateExpression: 'set #studentName = :newName, #studentAge = :newAge, #studentEmail = :newEmail',
    ExpressionAttributeNames: {
      '#studentName': 'name',
      '#studentAge': 'age',
      '#studentEmail': 'email',
    },
    ExpressionAttributeValues: {
      ':newName': name,
      ':newAge': age,
      ':newEmail': email,
    },
    ReturnValues: 'ALL_NEW',
  };

  docClient.update(params, (err, data) => {
    if (err) {
      console.error('Error updating student:', err);
      res.status(500).json({ error: 'Could not update student' });
    } else {
      console.log('Student updated successfully:', data);
      res.status(200).json({ message: 'Student updated successfully', updatedData: data.Attributes });
    }
  });
});


// DELETE

app.delete('/delete', async (req, res) => {    //------> delete all student's data
  try {
    const scanParams = {
      TableName: "Student-info",
    };
    const scanResult = await docClient.scan(scanParams).promise();
    
    const deletePromises = scanResult.Items.map(item => {
      const deleteParams = {
        TableName: "Student-info",
        Key: {
          'SPR_NO': item.SPR_NO
        }
      };
      return docClient.delete(deleteParams).promise();
    });
    await Promise.all(deletePromises);
    res.send("All items deleted successfully.");
  } catch (err) {
    res.status(500).send("Error deleting data");
  }
});




app.delete('/delete_student', (req, res) => {   //------> delete specific student data
  const studentId = req.body.id;
  const params = {
    TableName: 'Student-info',
    Key: {
      SPR_NO: studentId
    }
  };
  docClient.delete(params, (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).send("Error deleting data");
    } else {
      console.log("Delete successful:", data);
      res.send("Delete successful");
    }
  });
});



  


//api listening

app.listen(apiport, () => {
  console.log(`Server is running on port ${apiport}`);
});
