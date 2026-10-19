// Change this to your deployed URL when you deploy, e.g. https://your-app.onrender.com
const API_URL = 'http://localhost:3000/api/recipes';

const form = document.getElementById('recipeForm');
const tableBody = document.getElementById('tableBody');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');
const fields = ['title', 'description', 'ingredients', 'instructions', 'prep_time_minutes', 'servings', 'category'];

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function loadRecipes() {
  try {
    const res = await fetch(API_URL);
    const recipes = await res.json();
    tableBody.innerHTML = recipes.map(r => `
      <tr>
        <td>${r.id}</td>
        <td>${esc(r.title)}</td>
        <td>${esc(r.category)}</td>
        <td>${esc(r.prep_time_minutes)}</td>
        <td>${esc(r.servings)}</td>
        <td>${esc(r.ingredients)}</td>
        <td>
          <button onclick="editRecipe(${r.id})">Edit</button>
          <button onclick="deleteRecipe(${r.id})">Delete</button>
        </td>
      </tr>`).join('');
  } catch (err) {
    alert('Could not load recipes. Is the API running?');
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('recipeId').value;
  const body = {};
  fields.forEach(f => {
    const v = document.getElementById(f).value;
    body[f] = v === '' ? null : v;
  });
  const res = await fetch(id ? `${API_URL}/${id}` : API_URL, {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) { alert('Save failed'); return; }
  resetForm();
  loadRecipes();
});

async function editRecipe(id) {
  const res = await fetch(`${API_URL}/${id}`);
  const r = await res.json();
  document.getElementById('recipeId').value = r.id;
  fields.forEach(f => document.getElementById(f).value = r[f] ?? '');
  saveBtn.textContent = 'Update Recipe';
  cancelBtn.style.display = 'inline';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteRecipe(id) {
  if (!confirm('Delete this recipe?')) return;
  await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  loadRecipes();
}

function resetForm() {
  form.reset();
  document.getElementById('recipeId').value = '';
  saveBtn.textContent = 'Add Recipe';
  cancelBtn.style.display = 'none';
}
cancelBtn.addEventListener('click', resetForm);

loadRecipes();
