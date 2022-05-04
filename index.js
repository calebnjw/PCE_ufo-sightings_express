import express from 'express';
import methodOverride from 'method-override';
import { readFile, writeFile } from 'fs';

const app = express();

app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');

// get all sightings and present on a single page
app.get('/', (request, response) => {
  console.log('DISPLAY ALL: GET REQUEST');

  readFile('data.json', 'utf-8', (error, content) => {
    if (error) {
      console.log(error);
      return;
    }

    const JSONobject = JSON.parse(content);
    response.render('index', JSONobject);
  });
});

// display form to enter new sighting
app.get('/sighting', (request, response) => {
  console.log('NEW FORM: GET REQUEST');

  response.render('new-sighting');
});

// submit button will call this post request at the same route
app.post('/sighting', (request, response) => {
  console.log('NEW SIGHTING: POST REQUEST');

  // read existing JSON file
  readFile('data.json', 'utf-8', (readError, content) => {
    if (readError) {
      console.log(readError);
      return;
    }

    // parse the JSON file to get JSON object with key "sightings"
    // and value which is an array of sighting objects
    const JSONobject = JSON.parse(content);

    // sighting object comes from the form
    // data is accessed from request.body
    // stringify and then parse it again so that it will be understood as an object
    // not sure what express.json() is meant to do
    // since it's not converting request.body into an object already...
    const sighting = JSON.parse(JSON.stringify(request.body));

    // pushing new sighting object to JSONobject.sightings which is an array of sighting objects
    JSONobject.sightings.push(sighting);

    // stringify the entire JSON object
    const output = JSON.stringify(JSONobject);

    // save the sighting index number to the sighting object to be rendered
    sighting.index = JSONobject.sightings.length - 1;

    // and rewrite it to file
    writeFile('data.json', output, (writeError) => {
      if (writeError) {
        console.log(writeError);
        return;
      }

      response.render('sighting', { sighting });
    });
  });
});

// display sighting at index
app.get('/sighting/:index', (request, response) => {
  console.log('DISPLAY: GET REQUEST');

  const { index } = request.params;

  // request.params is reading style.css as one of the request params
  // this check is to stop it from throwing an error
  if (isNaN(index)) {
    response.end();
  } else {
    // same old read file
    readFile('data.json', 'utf-8', (readError, content) => {
      if (readError) {
        console.log(readError);
        return;
      }

      // JSON object with key "sightings" and value which is an array of sighting objects
      const JSONobject = JSON.parse(content);

      // sighting object at index
      const sighting = JSONobject.sightings[index];

      // if there is a sighting object,
      if (sighting) {
        // add the store the index in the object
        // (so that the page can render its own index
        sighting.index = index;
        // and render the new sighting
        response.render('sighting', { sighting });
      } else {
        // if not, tell the user there is no sighting at this index
        response.send('No sighting at this index, try again.');
      }
    });
  }
});

// display edit form at index with fields populated
app.get('/sighting/:index/edit', (request, response) => {
  console.log('EDIT FORM: GET REQUEST');

  const { index } = request.params;

  if (isNaN(index)) {
    response.end();
  } else {
    readFile('data.json', 'utf-8', (readError, content) => {
      if (readError) {
        console.log(readError);
        return;
      }

      const JSONobject = JSON.parse(content);

      const sighting = JSONobject.sightings[index];

      if (sighting) {
        sighting.index = index;
        response.render('edit-sighting', { sighting });
      } else {
        response.send('No sighting at this index, try again.');
      }
    });
  }
});

// submit button will call this put request at the same route
app.put('/sighting/:index/edit', (request, response) => {
  console.log('EDIT: PUT REQUEST');

  const { index } = request.params;

  if (isNaN(index)) {
    response.end();
  } else {
    readFile('data.json', 'utf-8', (readError, content) => {
      if (readError) {
        console.log(readError);
        return;
      }

      const JSONobject = JSON.parse(content);

      const sighting = JSON.parse(JSON.stringify(request.body));

      // replacing sighting object at index with updated content
      JSONobject.sightings[index] = sighting;

      const output = JSON.stringify(JSONobject);

      sighting.index = index;

      writeFile('data.json', output, (writeError) => {
        if (writeError) {
          console.log(writeError);
          return;
        }

        // render the edited sighting
        response.render('sighting', { sighting });
      });
    });
  }
});

// delete button will call this delete request at the same route
// logic is the same as post and put, but just doing one thing different
app.delete('/sighting/:index/delete', (request, response) => {
  const { index } = request.params;

  if (isNaN(index)) {
    response.end();
  } else {
    readFile('data.json', 'utf-8', (readError, content) => {
      if (readError) {
        console.log(readError);
        return;
      }

      const JSONobject = JSON.parse(content);

      // using splice to delete object at index
      JSONobject.sightings.splice(index, 1);

      const output = JSON.stringify(JSONobject);

      writeFile('data.json', output, (writeError) => {
        if (writeError) {
          console.log(writeError);
          return;
        }

        // send the user back home
        response.render('index', JSONobject);
      });
    });
  }
});

// display all shapes
app.get('/shapes', (request, response) => {
  readFile('data.json', 'utf-8', (readError, content) => {
    if (readError) {
      console.log(readError);
      return;
    }

    const { sightings } = JSON.parse(content);
    const JSONobject = {
      shapes: [],
    };

    sightings.forEach((element) => {
      const { shape } = element;
      if (JSONobject.shapes.indexOf(shape) >= 0) {
        console.log('Shape already present');
      } else {
        JSONobject.shapes.push(shape);
        console.log(JSONobject.shapes);
      }
    });

    response.render('shape', JSONobject);
  });
});

// display sightings filtered by shapes
app.get('/shapes/:shape', (request, response) => {
  const { shape: sightingShape } = request.params;

  if (sightingShape === 'styles.css') {
    response.end();
  } else {
    readFile('data.json', 'utf-8', (readError, content) => {
      if (readError) {
        console.log(readError);
        return;
      }

      // pass the whole JSON object into the render
      const JSONobject = JSON.parse(content);
      // pass the shape query as well
      JSONobject.shape = sightingShape;

      // logic for displaying shapes will be done on the ejs page
      // to make sure that the indices shown are correct
      // and will link to the correct page
      response.render('sighting-shape', JSONobject);
    });
  }
});

app.listen(3004, () => {
  console.log('App is listening on Port 3004');
});
