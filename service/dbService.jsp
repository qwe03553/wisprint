<%@ page language="java" pageEncoding="UTF-8" contentType="text/html;charset=UTF-8"%>
<%@ page import="org.json.*,java.util.*,org.apache.commons.io.*,java.io.File,com.jatools.mireport.*,com.jatools.jdbc.*,com.jatools.common.*"%>
<%
	response.setHeader("Cache-Control", "no-cache");
	response.setHeader("Pragma", "no-cache");
	response.setDateHeader("Expires", -1);
%>
<%
	// 用于数据源设计时，提供db meta等
	DBManager manager = DBManager.getInstance();
	String how = request.getParameter("how");
	String json = "";
	if (how.equals("getJDBCConfig")) {
		json = Result.result(true, manager.getJDBCConfig());
	} else if (how.equals("testConnection")) {
		String data = request.getParameter("data");
		String error = manager.testConnection(new JSONObject(data));
		json = Result.result(error == null, error);
	} else if (how.equals("saveJDBCConfig")) {
		String name = request.getParameter("name");
		String data = request.getParameter("data");
		boolean success = manager.saveJDBCConfig(name, new JSONObject(data));
		json = Result.result(success, (String) null);
	} else if (how.equals("saveAsJDBCConfig")) {
		String name = request.getParameter("name");
		String data = request.getParameter("data");
		boolean success = manager.saveJDBCConfig(name, new JSONObject(data));
		json = Result.result(true, manager.getJDBCConfig());
	} else if (how.equals("getJDBCVendors")) {
		json = Result.result(true, manager.getJDBCVendors());
	} else if (how.equals("getDBTableAndQuerys")) {
		String jdbcName = request.getParameter("jdbcName");
		json = Result.result(true, manager.getDBTableAndQuerys(jdbcName));
	} else if (how.equals("getFields")) {
		String jdbcName = request.getParameter("jdbcName");
		String table = request.getParameter("table");
		json = Result.result(true, manager.getTableFields(jdbcName, table));
	} else if (how.equals("saveQuery")) {
		String jdbcName = request.getParameter("jdbcName");
		String sql = request.getParameter("sql");
		boolean New = request.getParameter("new").equals("true");
		
		String name = request.getParameter("name");
		json = Result.result(true, manager.saveQuery(jdbcName, sql, name,New));
	} else if (how.equals("deleteQuery")) {
		String jdbcName = request.getParameter("jdbcName");
		String query = request.getParameter("query");
		
		json = Result.result(true, manager.deleteQuery(jdbcName,query));
	}
	

	
	System.out.println(json);
%>
<%=json%>